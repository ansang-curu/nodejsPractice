//익스프레스 사용
const express = require("express");
const app = express();
//mongo db 와 서버 연결
const { MongoClient, ObjectId } = require("mongodb");
// 매서드 오버라이드
const methodOverride = require("method-override");
// 비크립트 bcrypt
const bcrypt = require("bcrypt");
// 몽고 커넥트
const MongoStore = require("connect-mongo");

//퍼블릭폴더를 적용해서 안에 있는 파일 사용
app.use(express.static(__dirname + "/public")); //public �����를 static으로 사용
//ejs셋팅
app.set("view engine", "ejs");
//포스트 요청.body 도와주는거
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 메서드 오버라이드
app.use(methodOverride("_method"));
// 회원기능만들기 패스포트
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
app.use(passport.initialize());
app.use(
  session({
    secret: "암호화에 쓸 비번",
    resave: false,
    saveUninitialized: false,
    cooke: { maxAge: 60 * 60 * 1000 },
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://komodoking:zhahehdhkd@komodo.p9prg.mongodb.net/?retryWrites=true&w=majority&appName=komodo;",
      dbName: "forum2",
    }),
  })
);
app.use(passport.session());
// ------------------기본기능---------------------

//mongo db 와 서버 연결

let db;
const url =
  "mongodb+srv://komodoking:zhahehdhkd@komodo.p9prg.mongodb.net/?retryWrites=true&w=majority&appName=komodo;";
new MongoClient(url)
  .connect()
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("forum2");
    app.listen(8080, () => {
      console.log("http://localhost:8080 에서 서버 실행중");
    });
  })
  .catch((err) => {
    console.log("에러");
  });

app.get("/", (요청, 응답) => {
  응답.sendFile(__dirname + "/index.html");
});
//dirname 현재 프로젝트 절대경로 설정

app.get("/news", (요청, 응답) => {
  //db.collection('post').insertOne({name:'손'})  //db에 데이터 넣기
  응답.send("오늘비옴");
});

app.get("/list", async (요청, 응답) => {
  let result = await db.collection("post").find().toArray();
  //console.log(result)
  //응답.send('db게시물')
  응답.render("list.ejs", { posts: result });
});
app.get("/write", async (요청, 응답) => {
  let result = await db.collection("post").find().toArray();
  응답.render("write.ejs", { posts: result });
});
//포스트 요청
app.post("/add", async (요청, 응답) => {
  console.log(요청.body.title.trim().length);
  if (
    요청.body.title.trim().length == 0 ||
    요청.body.name.trim().length == 0 ||
    요청.body.content.trim().length == 0
  ) {
    응답.send("입력해라");
  } else {
    let { name, title, content } = 요청.body;
    let newPost = { name, title, content };
    try {
      await db.collection("post").insertOne(newPost);
      console.log("오 저장됨");
      응답.send("성공적저장!");
    } catch (err) {
      console.log("에러임", err);
      응답.status(500).send("오류가 발생했습니다");
    }
  }
});

//상세페이지
app.get("/detail/:id", async (요청, 응답) => {
  try {
    //파라미터 자리에 들어간거 확인
    let param = 요청.params.id;
    console.log(param);

    let result = await db
      .collection("post")
      .findOne({ _id: new ObjectId(param) });
    console.log(result);
    if (result == null) {
      응답.status(404).send("이상한url 입력");
    }
    //디테일 ejs보내줘
    응답.render("detail.ejs", { result: result });
  } catch (e) {
    console.log(e);
    응답.status(404).send("이상한url 입력");
  }
});

// 글수정 서버만들기
app.get("/edit/:id", async (요청, 응답) => {
  let result = await db
    .collection("post")
    .findOne({ _id: new ObjectId(요청.params.id) });
  console.log(result);
  응답.render("edit.ejs", { result: result });
});
// 글수정 포스트요청
app.put("/edit", async (요청, 응답) => {
  // 좋아요만들기
  await db.collection("post").updateOne(
    { _id: 1 },
    {
      $inc: { like: +1 },
    }
  );

  await db.collection("post").updateOne(
    { _id: new ObjectId(요청.body.id) },
    {
      $set: {
        title: 요청.body.title,
        content: 요청.body.content,
        name: 요청.body.name,
      },
    }
  );

  응답.redirect("/list");
});

app.delete("/delete", async (요청, 응답) => {
  console.log(요청.query);
  db.collection("post").deleteOne({ _id: new ObjectId(요청.query.docid) });
  응답.send("삭제완료");
});

app.get("/list/:id", async (요청, 응답) => {
  let result = await db
    .collection("post")
    .find()
    .skip((요청.params.id - 1) * 5)
    .limit(5)
    .toArray();
  //console.log(result)
  //응답.send('db게시물')
  응답.render("list.ejs", { posts: result });
});

app.get("/list/next/:id", async (요청, 응답) => {
  let result = await db
    .collection("post")
    .find({ _id: { $gt: new ObjectId(요청.params.id) } })
    .skip((요청.params.id - 1) * 5)
    .limit(5)
    .toArray();
  //console.log(result)
  //응답.send('db게시물')
  응답.render("list.ejs", { posts: result });
});

// 가입기능, 로그인기능, 로그인 완료시 세션만들기, 로그인 완료시 유저에게 입장권보내줌, 로그인 여부 확인하고싶으면 입장권까봄

passport.use(
  new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    // 제출한 아이디/비번 검사하는 코드
    let result = await db
      .collection("user")
      .findOne({ username: 입력한아이디 });
    if (!result) {
      return cb(null, false, { message: "아이디 DB에 없음" });
    }

    if (await bcrypt.compare(입력한비번, result.password)) {
      return cb(null, result);
    } else {
      return cb(null, false, { message: "비번불일치" });
    }
  })
);

passport.serializeUser((user, done) => {
  process.nextTick(() => {
    //내부코드를 비동기적으로 수행해줌
    done(null, { id: user._id, username: user.username });
  });
});

passport.deserializeUser(async (user, done) => {
  //요청.user하면 이제 유저정보나옴 쿠키를 까서 검사하는 역할
  let result = await db
    .collection("user")
    .findOne({ _id: new ObjectId(user.id) });
  delete result.password;
  process.nextTick(() => {
    done(null, result);
  });
});

app.get("/login", async (요청, 응답) => {
  console.log(요청.user);
  응답.render("login.ejs");
});

app.post("/login", async (요청, 응답, next) => {
  passport.authenticate("local", (error, user, info) => {
    if (error) return 응답.status(500).json(error);
    if (!user) return 응답.status(401).json(info.message);
    요청.logIn(user, (err) => {
      if (err) return next(err);
      응답.redirect("/");
    });
  })(요청, 응답, next);
});

//마이페이지 숙제

app.get("/my", async (요청, 응답) => {
  console.log(요청.user.username);
  응답.render("my.ejs", { user: 요청.user.username });
});

//가입기능

app.get("/register", async (요청, 응답) => {
  응답.render("register.ejs");
});

app.post("/register", async (요청, 응답) => {
  // await bcrypt.hash('문자',10) 해싱문자랑 해싱을 몇번할건지
  let 해시 = await bcrypt.hash(요청.body.password, 10);
  console.log(해시);
  await db
    .collection("user")
    .insertOne({ username: 요청.body.username, password: 해시 });
  응답.redirect("/");
});
