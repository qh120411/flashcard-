"use client";
import { useEffect, useMemo, useState } from "react";
import { cards, Rating } from "./data";

type Review = { word:string; rating:Rating; at:string };
const labels = { forgot:"Quên", hard:"Khó", remembered:"Nhớ" };
const DAILY_GOAL = 10;
const DAY_COUNT=Math.ceil(cards.length/DAILY_GOAL);
const dateKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const fromDateKey=(key:string)=>{const [year,month,day]=key.split("-").map(Number);return new Date(year,month-1,day)};
const dayDiff=(date:Date,start:Date)=>Math.floor((new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime()-new Date(start.getFullYear(),start.getMonth(),start.getDate()).getTime())/86400000);

export default function Home() {
  const [index,setIndex] = useState(0);
  const [flipped,setFlipped] = useState(false);
  const [topic,setTopic] = useState("Hôm nay");
  const [filter,setFilter] = useState("Tất cả");
  const [ratings,setRatings] = useState<Record<number,Rating>>({});
  const [history,setHistory] = useState<Review[]>([]);
  const [startDate,setStartDate] = useState("");
  const [selectedDate,setSelectedDate] = useState("");
  const [view,setView] = useState<"study"|"calendar">("study");
  const [calendarYear,setCalendarYear] = useState(new Date().getFullYear());
  const [ready,setReady] = useState(false);

  useEffect(()=>{ try { const today=dateKey(new Date());setRatings(JSON.parse(localStorage.getItem("wordly-ratings-v2")||"{}"));setHistory(JSON.parse(localStorage.getItem("wordly-history-v2")||"[]"));setStartDate(localStorage.getItem("wordly-start-date")||today);setSelectedDate(today); } catch {} setReady(true); },[]);
  useEffect(()=>{ if(ready){ localStorage.setItem("wordly-ratings-v2",JSON.stringify(ratings));localStorage.setItem("wordly-history-v2",JSON.stringify(history));localStorage.setItem("wordly-start-date",startDate); } },[ratings,history,startDate,ready]);

  const selectedDayIndex=startDate&&selectedDate?dayDiff(fromDateKey(selectedDate),fromDateKey(startDate)):0;
  const dailyCards=useMemo(()=>selectedDayIndex>=0&&selectedDayIndex<DAY_COUNT?cards.slice(selectedDayIndex*DAILY_GOAL,(selectedDayIndex+1)*DAILY_GOAL):[],[selectedDayIndex]);
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
  const todayKey=dateKey(new Date());
  const todayReviews=history.filter(item=>dateKey(new Date(item.at))===todayKey);
  const selectedReviews=history.filter(item=>dateKey(new Date(item.at))===selectedDate);
  const reviewedToday=new Set(todayReviews.map(item=>item.word)).size;
  const mastery=learned?Math.round(remembered/learned*100):0;
  const move=(n:number)=>{if(filtered.length){setIndex(i=>(i+n+filtered.length)%filtered.length);setFlipped(false)}};
  const rate=(rating:Rating)=>{if(!card)return;setRatings(r=>({...r,[card.id]:rating}));setHistory(h=>[{word:card.word,rating,at:new Date().toISOString()},...h].slice(0,2000));setTimeout(()=>{if(filter==="Chưa học"||(filter==="Đang học"&&rating==="remembered")){setIndex(i=>i%Math.max(filtered.length-1,1));setFlipped(false)}else move(1)},160)};
  const chooseDate=(key:string)=>{setSelectedDate(key);setTopic("Hôm nay");setFilter("Tất cả");setView("study")};
  const months=Array.from({length:12},(_,month)=>{const first=new Date(calendarYear,month,1);return {month,offset:(first.getDay()+6)%7,days:new Date(calendarYear,month+1,0).getDate()}});

  return <main>
    <header className="topbar">
      <a className="brand" href="#top"><b>W</b><span>Wordly</span></a>
      <div className="progress"><span><b>Tiến độ hôm nay</b><small>{reviewedToday}/{DAILY_GOAL} từ</small></span><i><em style={{width:`${reviewedToday/DAILY_GOAL*100}%`}}/></i></div>
      <div className="profile"><span>🔥 <b>{history.length?3:0}</b> ngày</span><i>QA</i></div>
    </header>

    <div className="workspace" id="top">
      <aside className="sidebar">
        <nav><button className={view==="study"?"active nav-button":"nav-button"} onClick={()=>setView("study")}>⌂ <span>Học từ</span></button><button className={view==="calendar"?"active nav-button":"nav-button"} onClick={()=>setView("calendar")}>▦ <span>Lịch học</span></button></nav>
        <section><h4>Bộ từ</h4>{topics.map(t=><button key={t} className={topic===t?"selected":""} onClick={()=>setTopic(t)}><span>{t}</span><b>{t==="Hôm nay"?DAILY_GOAL:t==="Tất cả"?cards.length:cards.filter(c=>c.topic===t).length}</b></button>)}</section>
        <section className="statuses"><h4>Trạng thái</h4>{["Tất cả","Chưa học","Đang học","Đã nhớ"].map(s=><button key={s} className={filter===s?"selected":""} onClick={()=>setFilter(s)}><span>● {s}</span></button>)}</section>
        <p>Nguồn từ vựng<br/><b>Academic Word List</b></p>
      </aside>

      {view==="study"?<section className="study" id="study">
        <div className="heading"><div><small>{topic==="Hôm nay"?`NGÀY ${selectedDayIndex+1} / ${DAY_COUNT} · ${selectedDate?new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"long",year:"numeric"}).format(fromDateKey(selectedDate)):""}`:"BỘ TỪ HỌC THUẬT"}</small><h1>Học vừa đủ, nhớ thật lâu.</h1><p>{topic==="Hôm nay"?`Lộ trình ${cards.length} từ được chia đều, mỗi ngày tối đa ${DAILY_GOAL} từ.`:"Chạm vào thẻ để xem nghĩa, họ từ và ví dụ."}</p></div><span><b>{filtered.length}</b> từ trong bộ lọc</span></div>
        {card ? <>
          <article className={`flashcard ${flipped?"flipped":""}`} onClick={()=>setFlipped(v=>!v)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setFlipped(v=>!v)}}>
            <div className="cardline"><span>{card.topic}</span><small>{index+1} / {filtered.length}</small></div>
            {!flipped?<div className="front"><small>{card.type}</small><h2>{card.word}</h2><p>{card.phonetic || `Academic Word List • ${card.topic}`}</p><button onClick={e=>{e.stopPropagation();speechSynthesis.speak(new SpeechSynthesisUtterance(card.word))}}>▶ Nghe phát âm</button><em>↻ Bấm để lật thẻ</em></div>
            :<div className="back"><section><small>NGHĨA TIẾNG VIỆT</small><h2>{card.meaning}</h2><p>{card.note}</p></section><section><small>HỌ TỪ</small><div>{card.family.map(x=><i key={x}>{x}</i>)}</div></section><blockquote><small>VÍ DỤ IELTS</small><p>“{card.example}”</p><span>{card.exampleVi}</span></blockquote><em>↻ Bấm để xem lại từ</em></div>}
          </article>
          <div className="controls"><button onClick={()=>move(-1)}>←</button><div><button className="forgot" onClick={()=>rate("forgot")}><i>×</i><b>Quên</b><small>Ôn lại sớm</small></button><button className="hard" onClick={()=>rate("hard")}><i>≈</i><b>Khó</b><small>Ôn ngày mai</small></button><button className="remember" onClick={()=>rate("remembered")}><i>✓</i><b>Nhớ</b><small>Ôn sau 3 ngày</small></button></div><button onClick={()=>move(1)}>→</button></div>
          <p className="tip">Mẹo: lật thẻ trước, rồi tự đánh giá mức độ ghi nhớ.</p>
        </>:<div className="empty"><b>✓</b><h2>Không có từ phù hợp</h2><p>Thử đổi bộ từ hoặc trạng thái để tiếp tục học.</p><button onClick={()=>{setTopic("Hôm nay");setFilter("Tất cả")}}>Về bộ hôm nay</button></div>}
      </section>:<section className="calendar-page">
        <div className="calendar-heading"><div><small>LỘ TRÌNH {DAY_COUNT} NGÀY</small><h1>Lịch học của bạn</h1><p>Chọn ngày để mở đúng bộ từ. Ngày có chấm xanh là ngày bạn đã học.</p></div><label>Bắt đầu từ <input type="date" value={startDate} onChange={e=>{if(e.target.value){setStartDate(e.target.value);setSelectedDate(e.target.value);setCalendarYear(fromDateKey(e.target.value).getFullYear())}}}/></label></div>
        <div className="year-nav"><button onClick={()=>setCalendarYear(y=>y-1)}>←</button><b>{calendarYear}</b><button onClick={()=>setCalendarYear(y=>y+1)}>→</button><button onClick={()=>{const now=new Date();setCalendarYear(now.getFullYear());chooseDate(dateKey(now))}}>Hôm nay</button></div>
        <div className="year-grid">{months.map(({month,offset,days})=><article className="month" key={month}><h3>{new Intl.DateTimeFormat("vi-VN",{month:"long"}).format(new Date(calendarYear,month,1))}</h3><div className="weekdays">{["T2","T3","T4","T5","T6","T7","CN"].map(d=><b key={d}>{d}</b>)}</div><div className="days">{Array.from({length:offset},(_,i)=><i key={`e${i}`}/>)}{Array.from({length:days},(_,i)=>{const key=dateKey(new Date(calendarYear,month,i+1));const planIndex=startDate?dayDiff(fromDateKey(key),fromDateKey(startDate)):-1;const inPlan=planIndex>=0&&planIndex<DAY_COUNT;const learnedCount=new Set(history.filter(r=>dateKey(new Date(r.at))===key).map(r=>r.word)).size;return <button key={key} className={`${key===todayKey?"today ":""}${key===selectedDate?"selected ":""}${learnedCount?"learned ":""}${inPlan?"planned":""}`} onClick={()=>chooseDate(key)} title={learnedCount?`Đã học ${learnedCount} từ`:(inPlan?`Ngày ${planIndex+1} của lộ trình`:"Chưa có lịch học")}><span>{i+1}</span>{learnedCount>0&&<em>{learnedCount}</em>}</button>})}</div></article>)}</div>
      </section>}

      <aside className="insights" id="history">
        <section className="stats"><header><div><small>{selectedDate===todayKey?"HÔM NAY":"NGÀY ĐANG CHỌN"}</small><h3>Thành tích của bạn</h3></div><b>✦</b></header><div className="numbers"><p><b>{new Set(selectedReviews.map(r=>r.word)).size}</b><span>Từ đã học ngày này</span></p><p><b>{remembered}</b><span>Đã nhớ tổng</span></p></div><div className="mastery"><span><b>Mức độ ghi nhớ</b><small>{mastery}%</small></span><i><em style={{width:`${mastery}%`}}/></i></div></section>
        <section className="history"><header><h3>Lịch sử gần đây</h3>{history.length>0&&<button onClick={()=>{setRatings({});setHistory([])}}>Đặt lại</button>}</header>
          {history.length?<div>{history.slice(0,7).map((r,n)=><p key={r.at+n}><i className={r.rating}>{r.rating==="remembered"?"✓":r.rating==="hard"?"≈":"×"}</i><span><b>{r.word}</b><small>{new Intl.DateTimeFormat("vi-VN",{hour:"2-digit",minute:"2-digit"}).format(new Date(r.at))}</small></span><em>{labels[r.rating]}</em></p>)}</div>:<div className="history-empty"><b>↺</b><span>Lịch sử ôn sẽ xuất hiện ở đây.</span></div>}
        </section>
        <blockquote className="quote">“Giỏi từ vựng không đến từ học thật nhiều, mà từ việc gặp lại đúng lúc.”</blockquote>
      </aside>
    </div>
  </main>
}
