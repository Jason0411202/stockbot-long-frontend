import React from "react";

import Head from "next/head";
import * as mainJS from "@/../public/js/helper.js";

export default function Home(props) {
  const [UGLData, GetUGLData] = React.useState([{stock_id: "Loading...", stock_name: "Loading...", today_price: "Loading...", lower_point_days: "Loading...", upper_point_days: "Loading..."}]);

  React.useEffect(() => {
    const data = mainJS.getSotckStatisticData(props);
    data.then((result) => {
      GetUGLData(result);
    });
  }, []);


  return (
    <>
      <Head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>長線股票模擬交易系統</title>
        <link rel="stylesheet" href="/css/main.css"></link>
      </Head>
      <main>
      <div class="container">
        <nav>
            <a href="/">首頁</a>
            <a href="/unrealized_gains_losses">未實現損益紀錄</a>
            <a href="/realized_gains_losses">已實現損益紀錄</a>
            <a href="/stock_statistic_data">追蹤股票資訊</a>
        </nav>
        <h1>長線股票模擬交易系統 (追蹤股票資訊)</h1>
        <table id="stock-table">
            <thead>
                <tr>
                    <th>股票代號</th>
                    <th>股票名稱</th>
                    <th>今日價格</th>
                    <th>位於近幾天之最低點</th>
                    <th>位於近幾天之最高點</th>
                </tr>
            </thead>
            <tbody>
              {UGLData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <a className="stock-link" href={`/stocks/${item.stock_id}`}>{item.stock_id}</a>
                  </td>
                  <td>{item.stock_name}</td>
                  <td>{item.today_price}</td>
                  <td>{item.lower_point_days}</td>
                  <td>{item.upper_point_days}</td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
      <div class="geometric-bg"></div>
      </main>
    </>
  );
}

// getStaticProps 是一個 next.js 中內建的函式
// 目的是取得靜態變數，並且將資料傳遞給 default function
export async function getStaticProps() {
  // 回傳一個 props 物件，這個物件中包含了兩個 key-value pair
  // 這個物件會被傳遞給 default function
  return {
    props: {
      REACT_APP_backendServer: process.env.REACT_APP_backendServer,
    }
  };
}