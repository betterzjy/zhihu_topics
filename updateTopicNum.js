var fs = require('fs');
var request = require('request');
var mongoose = require('mongoose');
var cheerio = require('cheerio');
var EventProxy = require('eventproxy');
var superagent = require('superagent');

// 建立log
var Winston = require('winston');
var winston = new (Winston.Logger)({
    transports: [
        new (Winston.transports.Console)(),
        new (Winston.transports.File)({ filename: 'log/getTopicFollowNum.log' })
    ]
});

var winstonDb = new (Winston.Logger)({
    transports: [
        new (Winston.transports.Console)(),
        new (Winston.transports.File)({ filename: 'log/getTopicFollowNum-db.log' })
    ]
});


var db = mongoose.createConnection('localhost', 'zhihu');


// 抓取速度控制
var totalEp = new EventProxy();
totalEp.tail('expandNewTopic', function (expandNewTopic) {
    //开始扩展topic
    console.log('开始扩展新的 topic ...');
    topicExpand();
});




var Schema = mongoose.Schema;

//话题 Schema
//初始话题 Schema
var TopicSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    id: {
        type: Number,
        required: true
    },
    img: {
        type: String
    },
    depth: {
        type: Number,
        required: true
    },
    isEnum: {
        type: Boolean,
        required: true
    },
    followNumber: {
        type: Number
    },
    category: {
        id: {
            type: Number
        },
        name: {
            type: String
        }
    },
    categories: [{
        id: {
            type: Number
        },
        name: {
            type: String
        }
    }],
    other: Schema.Types.Mixed,
    children: [Number]
});

// 连接 topic 数据
var TopicModel = db.model('topic', TopicSchema);


// 更新话题 关注人数
function topicExpand () { 
    TopicModel.
    findOne({}).
    where('followNumber').equals(-1).
    exec(function (err, topic) {
        if (err) {
            //TODO
            winstonDb.error('请求数据库时发生错误:' + err);
        }
        if (!topic) {
            //topic不存在, 说明已经扩展完毕
            winston.info('扩展完毕!!!!!')

        } else {
            //topic 存在,则对 topic 进行更新
            var topicId = topic.id;
            console.log('开始扩展' + topicId);
            getFollowPeopleNum(topicId, topic);
        }
    });
}

var queryParams = {
    // proxy: 'http://localhost:8888',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36',
        'Cookie': '__utmv=51854390.100-1|2=registration_date=20140411=1^3=entry_date=20140411=1; q_c1=b4e7d84aa1ec4dcca1b746694ffc3f98|1461155464000|1461155464000; cap_id="ZmU0YTBjZTIwZjFjNDAxNzgyYWU2ZjM3ODE2YjRmY2Q=|1461155464|00a9045c627f6b1f2c96d90a5710fb1c59eddab0"; l_cap_id="NDQyMThkZGZjYWY1NDM2OWJlYjg1NWRiNGI4MDFlNzE=|1461155464|0e1761433394a77a7b2f31488479a8b46d7388de"; d_c0="AEDAUm39zAmPTiFynpSZCppDuQj6aDCY_tI=|1461155465"; _zap=73e0665e-2084-4cad-bf5e-16551788b26c; _za=e7cbbea5-a817-4688-9f8d-8f7bcefb506e; login="ZjJkNTA2OWRkNDk0NDYwYWFhOThkNjBhYWFiZGVjYjg=|1461155471|ec4683aecc363fc6a54c98216fc07c5579738f5c"; z_c0="QUFCQWJyb3JBQUFYQUFBQVlRSlZUWThEUDFjc1Z5c2ljdlVkNjZ4UjZtU1NoaE1BNDdoOXlBPT0=|1461155471|9d210018f8d5018339234b3f5a1e592f6dad3865"; _xsrf=6cf81e9c15167ad481ee5fff60259dd0; __utma=51854390.1560872610.1462365673.1462366143.1462367998.3; __utmb=51854390.4.10.1462367998; __utmc=51854390; __utmz=51854390.1462367998.3.3.utmcsr=zhihu.com|utmccn=(referral)|utmcmd=referral|utmcct=/topic/19550994/organize; l_n_c=1; q_c1=9e11abb228f648d5996c37c19d540b2e|1462503900000|1462503900000; cap_id="NzY2ODgyOWMxNTIzNGI3ZGFjZTdkOGMwMzEwZjY0M2Q=|1462503900|a14419a7b88eb3e33660c52114b5a8079c5faed6"; l_cap_id="ZTVjNzFjNWIyZmNjNGRjZmEyYzdiOGIxOGIzNmMxYWU=|1462503900|734ef2eba4c2d1c53bf6e3e2fd9e5455be395c46"; _xsrf=69dbbaae2281e96ee0a798f1c74a5a5d; d_c0="AFCAFk4V4QmPTsRsfDxSLbZ-TV7MsAttuac=|1462503902"; _za=81edf02d-26d3-4a62-a458-693dca728726; _zap=c36dbd5b-e68e-4539-8bdb-0e4e31b750f5; login="MGRjM2QwNzhmOGY0NGMwNTg0MzQ0MzE2NjQ2ZTI0Y2E=|1462503911|a83c17a97cf5456ff5d870fd85a850c43bb8eb9a"; z_c0=Mi4wQUFCQWJyb3JBQUFBVUlBV1RoWGhDUmNBQUFCaEFsVk41NVpUVndCYkJTR0NJaHZzYkxweXJHX1ZyNllVOE0wc05n|1462503911|7ebed135771b633a85298aad155c9fc25ed42458; __utma=51854390.941428982.1462503903.1462503903.1462503903.1; __utmc=51854390; __utmz=51854390.1462503903.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utmv=51854390.100-1|2=registration_date=20140411=1^3=entry_date=20140411=1'
    }
};

var followNumUrl = "https://www.zhihu.com/topic/",
    subfix = "/organize";


function getFollowPeopleNum(topicId, topic) {
    var requestUrl = followNumUrl + topicId + subfix;
    queryParams.url = requestUrl;
    request.get(queryParams, function (err, httpResponse, body) {
        if (err) {
            winston.error('请求parent:  时候,发生错误: ' + err);
            handleRequsetError();
            return;
        }
        if (httpResponse.statusCode !== 200) {
            winston.error('请求parent:  时候,发生错误代码为: ' + httpResponse.statusCode);
            handleRequsetError();
            return;
        }
        var regTest = /<strong>(.+)<\/strong>/i;
        try {
            var res = regTest.exec(body)[1];
            topic.followNumber = Number(res);
            topic.save();
            // 继续扩展
            setTimeout(function () {
                totalEp.emit('expandNewTopic');
            })
        } catch(err) {
            winston.error('发生错误' + err);
            handleRequsetError();
        }
    })
}



//开始扩展话题
totalEp.emit('expandNewTopic');

//处理报错
function handleRequsetError() {
    if (++errTimes < 20) {
        setTimeout(function () {
            totalEp.emit('expandNewTopic');
        }, 500);
    }
}

// 每100秒将 errTime 置 0
function setErrTimesZero() {
    errTimes = 0;
    setTimeout(setErrTimesZero, 100000);
}
setTimeout(setErrTimesZero, 100000);

// 记录数据库保存错误
function logDbSaveError(err) {
    if (err) {
        winstonDb.error("保存topic时出现错误:" + err);
        return;
    }
}

















