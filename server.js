/*mysql 연동을 지원하는 웹서버를 구축하자!!*/
var http = require("http"); //기본 내장 웹서버 모듈
var mysql = require("mysql");//외부 모듈 가져오기
var querystring = require("querystring");//post 파라미터 처리 모듈
var fs = require("fs"); //File System 내장모듈
var url = require("url"); //resolution, parsing

//node.js의 모듈 중 jsp, php, asp  와 같은 서버에서만 
//해석 및 실행되는 스크립트 기술이 지원된다..
//이를 지원하는 모듈이 ejs모듈이다!!!
var ejs = require("ejs");

//우리도 모듈을 정의할 수 있다...
//모듈은 각종 속성과 메서드로 구성된 파일이다..

//mysql 접속 정보 
const conStr = {
    url:"localhost:3306", 
    database:"ios",
    user:"root",
    password:"1234"
}


var server = http.createServer(function(request, response){
    console.log("클라이언트의 요청 url", request.url);
    //request.url의 문제점?  url에 대한 이해를 하지 못하고, 
    //단순 문자열 비교를 히려고 한다..따라서 파라미터가 포함되어 있을경우
    //문자열이 틀리다고 생각해버린다.. 
    //URL전문적으로 다루는 모듈을 도입하겠다!!
    const path = url.parse(request.url).pathname;

    switch(path){
        case "/hero/join":joinform(response);break;//등록폼 요청
        case "/hero/insert":insert(request, response);break;//한건 등록
        case "/hero/list":selectAll(request, response);break; //목록 가져오기
        case "/hero/select":select(request, response);break;//한건 가져오기
        case "/hero/update":update(request, response);break;//수정하기
        case "/hero/delete":remove(request, response);break;//삭제하기
    }
}); 

//등록 폼 요청에 대한 처리 
function joinform(response){
    fs.readFile("join.html", "utf8", function(err, data){
        response.writeHead(200, {"Content-Type":"text/html;charset=utf-8"});
        response.end(data);
    });
}

//등록하기 
function insert(request , response){
    //넘겨받은 request 객체로 부터 파라미터 뽑아내기!!! 
    //입력양식으로 전송될 예정이므로, post로 전송될 것이다!!!
    //node.js에서  post 로 전송될때는 querystring 모듈을 사용해보자!!
    //post방식은 request객체의 on 이벤트 핸들러로 데이터가 전송된 시점
    //에 처리해야 한다..
    var content=""; //이벤트가 여러번 발생할 수도 있기에
    //변수에 데이터 모아놓자!!
    request.on("data", function(data){
        content += data; //누적!!

        var json = querystring.parse(content);
        console.log(json);
        //mysql  insert !!!
        var client = mysql.createConnection(conStr);
        var sql="insert into hero(name,gender,age) values(?,?,?)";
        
        //쿼리 수행
        client.query(sql,[json.name , json.gender, json.age ] ,function(err, fields){
            var result;
            if(err){
                console.log("insert 실패");
                result={
                    code:0,
                    msg:"등록실패"
                }
            }else{
                console.log("insert 성공");
                result={
                    code:1,
                    msg:"등록성공"
                }
            }  
            response.writeHead(200,{"Content-Type":"text/json;charset=utf-8"});      
            response.end(JSON.stringify(result));
        });      

    });


}

//목록가져오기 
function selectAll(request, response){
    var client = mysql.createConnection(conStr);
    var sql="select * from hero order by hero_id asc";

    //두번째 인 수인 result에 레코드셋이 담겨진다..
    client.query(sql, function(err, result, fields){
        if(err){
            console.log(err);
        }else{
            console.log(result);
            //레코드 셋 집합의 정보가 list.ejs에 반영되도록 해야 한다!!
            response.writeHead(200, {"Content-Type":"text/html;charset=utf-8"});
            fs.readFile("list.ejs", "utf8", function(err, data){
                response.end(ejs.render(data,{
                    "record" : result
                }));
            });            
        }
    })

}

//한건 가져오기 
function select(request, response){
    var client = mysql.createConnection(conStr); 
    var sql ="select * from hero where hero_id=?";
    //요청 객체로 부터 get방식으로 전송된 파라미터 추출하기!!
    //json으로 받기 위해서는 url객체가 필요함 
    var urlObj = url.parse(request.url, true); //true옵션을 주면 JSON으로 반환해줌
    var json = urlObj.query;//제이슨 객체로 받음
    console.log("클라이언트가 전송한 hero_id값은 ", json.hero_id);

    client.query(sql, [ json.hero_id] , function(err, result, fields){
        console.log("result : ",result);     
        
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});    

        fs.readFile("detail.ejs", "utf8", function(err, data){
            response.end(ejs.render(data,{
                "record" : result[0]
            }));
        });            

    });

}

//수정하기 
function update(request ,response){
    //파라미터 받기!!
    var content="";
    request.on("data", function(data){
        content += data;
        var json = querystring.parse(content);     

        console.log("name:", json.name);
        console.log("gender:", json.gender);
        console.log("age:", json.age);

        const client = mysql.createConnection(conStr);
        
        var sql = "update hero set name=?, gender=?, age=?";
        sql += " where hero_id=?";

        client.query(sql, [json.name, json.gender, json.age, json.hero_id] , function(err, fields){
            if(err){
                console.log("수정실패",err);
            }else{
                console.log("수정성공");
            }
        });

    });

}

//삭제하기 
function remove(request, response){
    //삭제를 위한 hero_id  파라미터 받기 
    var urlObj = url.parse(request.url, true);    
    var json = urlObj.query;
    var hero_id = json.hero_id;

    var client = mysql.createConnection(conStr);    
    var sql="delete from hero where hero_id=?";
    client.query(sql, [hero_id], function(err, fields){
        if(err){
            console.log("삭제실패", err);
        }else{
            response.writeHead(301,{"Location":"/hero/list"});    
            response.end();            
        }
    });

}

server.listen(7777, function(){
    console.log("The server is running at 7777 port...");
});


