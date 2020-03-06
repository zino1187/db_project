/*mysql 연동을 지원하는 웹서버를 구축하자!!*/
var http = require("http"); //기본 내장 웹서버 모듈
var mysql = require("mysql");//외부 모듈 가져오기
//우리도 모듈을 정의할 수 있다...
//모듈은 각종 속성과 메서드로 구성된 파일이다..
var fs = require("fs");
var ejs = require("ejs");
var url = require("url");

//mysql 접속 정보 
const conStr = {
    url:"localhost:3306", 
    database:"ios",
    user:"root",
    password:"1234"
}
var client = mysql.createConnection(conStr);

var server = http.createServer(function(request, response){
    
    switch(request.url){
        case "/hero/list":selectAll(request, response);break;
        case "/hero/detail":select(request, response);break;
    }
    selectAll(request , response);

}); 

function regist(request){
    //mysql  insert !!!
    
    var sql="insert into hero(name,gender,age) values(?,?,?)";
    
    //쿼리 수행
    client.query(sql, ["토르","남",36],function(err, fields){
        if(err){
            console.log("insert 실패");
        }else{
            console.log("insert 성공");
        }        
    });    
}

function selectAll(request, response){
    var sql="select * from hero";
    client.query(sql, function(err, result, fields){
        fs.readFile("list2.ejs", "utf8", function(err, data){
            response.writeHead(200, {"Content-Type":"text/html;charset=utf-8"});
            response.end(ejs.render(data, {
                "result":result
            } ));        
        });        
    });


}

function select(request, response){
    var sql="select * from hero where hero_id=?";
    const json = url.parse(request.url, true);

    client.query(sql,[json.hero_id] ,function(err, result, fields){
        fs.readFile("detail2.ejs", "utf8", function(err, data){
            response.writeHead(200, {"Content-Type":"text/html;charset=utf-8"});
            response.end(ejs.render(data, {
                "result":result
            } ));        
        });        
    });
}

function update(request){

}
function remove(request){

}

server.listen(7777, function(){
    console.log("The server is running at 7777 port...");
});