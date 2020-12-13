var fs = require('fs');
var ejs = require('ejs');
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');

// DB접근
var client = mysql.createConnection({
  user: 'root',   password: '1234',  database: 'company'
});

// 서버 생성
var app = express();

app.use(bodyParser.urlencoded({  extended: false   }));
// 서버 실행
app.listen(52273, function () {
  console.log('server running at http://127.0.0.1:52273');
});

// 일단 소비자 화면
app.get('/', function (request, response) {
    console.log('homepage In');

    response.redirect('/customer')

    // let session = request.session;
    // if(session.success == 1)  response.redirect("/admin");
    // else response.redirect("/customer");
});

// 소비자 화면
app.get('/customer', function (request, response) {
  console.log('In customer');

  fs.readFile('21624118.html', 'utf8', function (error, data) {
    var full_item;
    var series;

    // 전체상품
    client.query('SELECT * FROM products', function (error, results) {
      full_item=results;
    });

    // 카테고리
    client.query('SELECT DISTINCT series FROM products', function(error, result){
      series=result;
    });

    // 뒤에서 6개 상품
    client.query('SELECT * FROM(SELECT * FROM products ORDER BY id DESC LIMIT 6) as lm6 ORDER BY id ASC',
      function(error, result){
        // 결과 반환
        // render( 'ejs파일 경로', 'json 형태 데이터');
        response.send(ejs.render(data, {
          newdata: result,
          data: full_item,
          category: series
        }));
    });
  });
});

// 아이템 상세 설명 창
app.get('/item/:id', function(request, response){
  console.log('In GET item :' + request.params.id);

  fs.readFile('item.html', 'utf-8', function(error, data){
    client.query('SELECT * FROM products WHERE id = ?', [
      request.params.id
    ], function(error, result){
      response.send(ejs.render(data,{
        data: result[0]
      }));
    });
  });
});

// 관리자 화면
app.get('/admin', function (request, response) {
  console.log('In admin');

  // let session = request.session;

  // 파일을 읽습니다.
  fs.readFile('admin.html', 'utf8', function (error, data) {
    // 데이터베이스 쿼리를 실행합니다.
    client.query('SELECT * FROM products', function (error, results) {
      // 응답합니다.
      response.send(ejs.render(data, {
        data: results
      }));
    });
  });
}); 

// 아이템 추가
app.post('/admin', function (request, response) {
  console.log('In Post admin');

  var body = request.body;
  console.log(body);
  client.query('INSERT INTO products (name, modelnumber, series) VALUES (?, ?, ?)', [
      body.name, body.model_number, body.series
  ], function () {
    response.redirect('/admin');
  });
});

// 아이템 삭제
app.get('/delete/:id', function (request, response) {
  console.log('In GET delete :' + request.params.id);

  client.query('DELETE FROM products WHERE id=?', [request.params.id], function () {
    response.redirect('/admin');
 });
});

// 아이템 수정 페이지 화면
app.get('/edit/:id', function (request, response) {
  console.log('In GET edit :' + request.params.id);

  fs.readFile('edit.html', 'utf8', function (error, data) {
    client.query('SELECT * FROM products WHERE id = ?', [
        request.params.id
    ], function (error, result) {
      response.send(ejs.render(data, {
        data: result[0]
      }));
    });
  });
});

// 아이템 수정
app.post('/edit/:id', function (request, response) {
  console.log('In POST edit :' + request.params.id);

  var body = request.body;
  console.log(body);
  console.log(body.name);
  client.query('UPDATE products SET name=?, modelnumber=?, series=? WHERE id=?', 
      [body.name, body.model_number, body.series, request.params.id], function (error, result) {
      if(error){
        console.log(error);
      }
      response.send();
  });
});

// 상품 관리 페이지
app.get('/manage', function(request, response){
  fs.readFile('manage.html', 'utf8', function (error, data) {
    response.send(data);
  });
});

// db에 초기 아이템 생성
app.get('/__!create_item__', function(request, response) {
  console.log('In !create_item');

  // 아이템이 없다면 생성
  client.query('SELECT COUNT(*) AS cnt FROM products', function(err, result){
    if (result[0].cnt == 0){
      // csv 파일 읽어서 쿼리로 입력
      fs.readFile('MOCK_DATA.csv', 'utf-8', function(error, data){
          let dataArray = data.split(/\r?\n/);
          dataArray.forEach(element => {
            let test = element.split(',');
            client.query('INSERT INTO products (name, modelnumber, series) VALUES (?, ?, ?)', [
              test[0], test[1], test[2]
            ]);
          });
      });
      console.log('Create Item');
    }
  });

  response.redirect('/admin');
});

// 아이템 개수 구하기
app.get('/__!count_item__', function(request, response){
  console.log('In !count_item');

  client.query('SELECT COUNT(*) AS cnt FROM products', function(error, result){
    if(!error){
      console.log(result);
      response.send('<p>' + result[0].cnt + '</p>')
    }
  });
});

// products 테이블 초기화
app.get('/__!truncate_products__', function(request, response){
  console.log('In !ctruncate_products');

  client.query('truncate products', function(error, result){
    if(!error){
      console.log(result);
    }

    response.redirect('/admin');
  });
});