"use client";
import { useEffect, useMemo, useState } from "react";
import { cards, Rating } from "./data";

type Review = { word:string; rating:Rating; at:string };
const labels = { forgot:"Quên", hard:"Khó", remembered:"Nhớ" };
const DAILY_GOAL = 10;

export default function Home() {
  const [index,setIndex] = useState(0);
  const [flipped,setFlipped] = useState(false);
  const [topic,setTopic] = useState("Hôm nay");
  const [filter,setFilter] = useState("Tất cả");
  const [ratings,setRatings] = useState<Record<number,Rating>>({});
  const [history,setHistory] = useState<Review[]>([]);
  const [ready,setReady] = useState(false);

  useEffect(()=>{ try { setRatings(JSON.parse(localStorage.getItem("wordly-ratings-v2")||"{}")); setHistory(JSON.parse(localStorage.getItem("wordly-history-v2")||"[]")); } catch {} setReady(true); },[]);
  useEffect(()=>{ if(ready){ localStorage.setItem("wordly-ratings-v2",JSON.stringify(ratings)); localStorage.setItem("wordly-history-v2",JSON.stringify(history)); } },[ratings,history,ready]);

  const dailyCards=useMemo(()=>{
    const day=Math.floor(Date.now()/86400000);
    const start=(day*DAILY_GOAL)%cards.length;
    return Array.from({length:DAILY_GOAL},(_,offset)=>cards[(start+offset)%cards.length]);
  },[]);
  const dailyIds=useMemo(()=>new Set(dailyCards.map(card=>card.id)),[dailyCards]);
  const topics=["Hôm nay","Tất cả",...Array.from(new Set(cards.map(c=>c.topic)))];
  const filtered=useMemo(()=>cards.filter(c=>{
    const rating=ratings[c.id];
    const inSelectedDeck=topic==="Hôm nay"?dailyIds.has(c.id):(topic==="Tất cả"||c.topic===topic);
    return inSelectedDeck && (filter==="Tất cả"||(filter==="Chưa học"&&!rating)||(filter==="Đang học"&&(rating==="forgot"||rating==="hard"))||(filter==="Đã nhớ"&&rating==="remembered"));
  }),[topic,filter,ratings,dailyIds]);
  useEffect(()=>{setIndex(0);setFlipped(false)},[topic,filter]);
  const card=filtered[index%Math.max(filtered.length,1)];
  const learned=Object.keys(ratings).length;
  const remembered=Object.values(ratings).filter(v=>v==="remembered").length;
  const todayKey=new Date().toDateString();
  const todayReviews=history.filter(item=>new Date(item.at).toDateString()===todayKey);
  const reviewedToday=new Set(todayReviews.filter(item=>dailyCards.some(cardItem=>cardItem.word===item.word)).map(item=>item.word)).size;
  const mastery=learned?Math.round(remembered/learned*100):0;
  const move=(n:number)=>{if(filtered.length){setIndex(i=>(i+n+filtered.length)%filtered.length);setFlipped(false)}};
  const rate=(rating:Rating)=>{if(!card)return;setRatings(r=>({...r,[card.id]:rating}));setHistory(h=>[{word:card.word,rating,at:new Date().toISOString()},...h].slice(0,30));setTimeout(()=>{if(filter==="Chưa học"||(filter==="Đang học"&&rating==="remembered")){setIndex(i=>i%Math.max(filtered.length-1,1));setFlipped(false)}else move(1)},160)};

  return <main>
    <header className="topbar">
      <a className="brand" href="#top"><b>W</b><span>Wordly</span></a>
      <div className="progress"><span><b>Tiến độ hôm nay</b><small>{reviewedToday}/{DAILY_GOAL} từ</small></span><i><em style={{width:`${reviewedToday/DAILY_GOAL*100}%`}}/></i></div>
      <div className="profile"><span>🔥 <b>{history.length?3:0}</b> ngày</span><i>QA</i></div>
    </header>

    <div className="workspace" id="top">
      <aside className="sidebar">
        <nav><a className="active" href="#study">⌂ <span>Học từ</span></a><a href="#history">↺ <span>Lịch sử</span></a></nav>
        <section><h4>Bộ từ</h4>{topics.map(t=><button key={t} className={topic===t?"selected":""} onClick={()=>setTopic(t)}><span>{t}</span><b>{t==="Hôm nay"?DAILY_GOAL:t==="Tất cả"?cards.length:cards.filter(c=>c.topic===t).length}</b></button>)}</section>
        <section className="statuses"><h4>Trạng thái</h4>{["Tất cả","Chưa học","Đang học","Đã nhớ"].map(s=><button key={s} className={filter===s?"selected":""} onClick={()=>setFilter(s)}><span>● {s}</span></button>)}</section>
        <p>Nguồn từ vựng<br/><b>Academic Word List</b></p>
      </aside>

      <section className="study" id="study">
        <div className="heading"><div><small>{topic==="Hôm nay"?"10 TỪ MỖI NGÀY":"BỘ TỪ HỌC THUẬT"}</small><h1>Học vừa đủ, nhớ thật lâu.</h1><p>{topic==="Hôm nay"?"Mỗi ngày 10 từ mới, không cần nhồi cả nhóm 60 từ.":"Chạm vào thẻ để xem nghĩa, họ từ và ví dụ."}</p></div><span><b>{filtered.length}</b> từ trong bộ lọc</span></div>
        {card ? <>
          <article className={`flashcard ${flipped?"flipped":""}`} onClick={()=>setFlipped(v=>!v)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setFlipped(v=>!v)}}>
            <div className="cardline"><span>{card.topic}</span><small>{index+1} / {filtered.length}</small></div>
            {!flipped?<div className="front"><small>{card.type}</small><h2>{card.word}</h2><p>{card.phonetic || `Academic Word List • ${card.topic}`}</p><button onClick={e=>{e.stopPropagation();speechSynthesis.speak(new SpeechSynthesisUtterance(card.word))}}>▶ Nghe phát âm</button><em>↻ Bấm để lật thẻ</em></div>
            :<div className="back"><section><small>NGHĨA TIẾNG VIỆT</small><h2>{card.meaning}</h2><p>{card.note}</p></section><section><small>HỌ TỪ</small><div>{card.family.map(x=><i key={x}>{x}</i>)}</div></section><blockquote><small>VÍ DỤ IELTS</small><p>“{card.example}”</p><span>{card.exampleVi}</span></blockquote><em>↻ Bấm để xem lại từ</em></div>}
          </article>
          <div className="controls"><button onClick={()=>move(-1)}>←</button><div><button className="forgot" onClick={()=>rate("forgot")}><i>×</i><b>Quên</b><small>Ôn lại sớm</small></button><button className="hard" onClick={()=>rate("hard")}><i>≈</i><b>Khó</b><small>Ôn ngày mai</small></button><button className="remember" onClick={()=>rate("remembered")}><i>✓</i><b>Nhớ</b><small>Ôn sau 3 ngày</small></button></div><button onClick={()=>move(1)}>→</button></div>
          <p className="tip">Mẹo: lật thẻ trước, rồi tự đánh giá mức độ ghi nhớ.</p>
        </>:<div className="empty"><b>✓</b><h2>Không có từ phù hợp</h2><p>Thử đổi bộ từ hoặc trạng thái để tiếp tục học.</p><button onClick={()=>{setTopic("Hôm nay");setFilter("Tất cả")}}>Về bộ hôm nay</button></div>}
      </section>

      <aside className="insights" id="history">
        <section className="stats"><header><div><small>HÔM NAY</small><h3>Thành tích của bạn</h3></div><b>✦</b></header><div className="numbers"><p><b>{todayReviews.length}</b><span>Lượt ôn hôm nay</span></p><p><b>{remembered}</b><span>Đã nhớ tổng</span></p></div><div className="mastery"><span><b>Mức độ ghi nhớ</b><small>{mastery}%</small></span><i><em style={{width:`${mastery}%`}}/></i></div></section>
        <section className="history"><header><h3>Lịch sử gần đây</h3>{history.length>0&&<button onClick={()=>{setRatings({});setHistory([])}}>Đặt lại</button>}</header>
          {history.length?<div>{history.slice(0,7).map((r,n)=><p key={r.at+n}><i className={r.rating}>{r.rating==="remembered"?"✓":r.rating==="hard"?"≈":"×"}</i><span><b>{r.word}</b><small>{new Intl.DateTimeFormat("vi-VN",{hour:"2-digit",minute:"2-digit"}).format(new Date(r.at))}</small></span><em>{labels[r.rating]}</em></p>)}</div>:<div className="history-empty"><b>↺</b><span>Lịch sử ôn sẽ xuất hiện ở đây.</span></div>}
        </section>
        <blockquote className="quote">“Giỏi từ vựng không đến từ học thật nhiều, mà từ việc gặp lại đúng lúc.”</blockquote>
      </aside>
    </div>
  </main>
}
