//익스프레스 사용
const express=require('express')
const app = express()
//mongo db 와 서버 연결
const{MongoClient, ObjectId}=require('mongodb');

//퍼블릭폴더를 적용해서 안에 있는 파일 사용
app.use(express.static(__dirname+'/public')) //public �����를 static으로 사용
//ejs셋팅
app.set('view engine','ejs')
//포스트 요청.body 도와주는거
app.use(express.json())
app.use(express.urlencoded({extended:true}))


//mongo db 와 서버 연결


let db;
const url='mongodb+srv://komodoking:zhahehdhkd@komodo.p9prg.mongodb.net/?retryWrites=true&w=majority&appName=komodo;'
new MongoClient(url).connect().then((client)=>{
console.log('DB연결성공')
db=client.db('forum2');
app.listen(8080,()=>{
console.log('http://localhost:8080 에서 서버 실행중')
})
}).catch((err)=>{
console.log('에러')})




app.get('/',(요청,응답)=>{
응답.sendFile(__dirname+'/index.html')
})
//dirname 현재 프로젝트 절대경로 설정

app.get('/news',(요청,응답)=>{
//db.collection('post').insertOne({name:'손'})  //db에 데이터 넣기
응답.send('오늘비옴')
})

app.get('/list',async(요청,응답)=>{
let result= await db.collection('post').find().toArray()
//console.log(result)
//응답.send('db게시물')
응답.render('list.ejs',{posts:result})
})
app.get('/write',async(요청,응답)=>{
let result= await db.collection('post').find().toArray()
응답.render('write.ejs',{posts:result})
})
//포스트 요청
app.post('/add',async(요청,응답)=>{
console.log(요청.body.title.trim().length)
if(요청.body.title.trim().length==0||요청.body.name.trim().length==0||요청.body.content.trim().length==0){
응답.send('입력해라')}else{
let {name,title,content}=요청.body;
let newPost={name,title,content}
try{
await db.collection('post').insertOne(newPost)
console.log('오 저장됨')
응답.send('성공적저장!')
}catch(err){
console.log('에러임',err)
응답.status(500).send('오류가 발생했습니다')
}}
})

//상세페이지
app.get('/detail/:id',async(요청,응답)=>{

try{
//파라미터 자리에 들어간거 확인
let param=요청.params.id
console.log(param)

let result= await db.collection('post').findOne({_id:new ObjectId(param)})
console.log(result)
if(result==null){
응답.status(404).send('이상한url 입력')
}
//디테일 ejs보내줘
응답.render('detail.ejs',{result:result})


}catch(e){
console.log(e)
응답.status(404).send('이상한url 입력')
}

})
