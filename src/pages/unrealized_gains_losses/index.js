import React from "react";

import Head from "next/head";
import * as mainJS from "@/../public/js/helper.js";

export default function Home() {
  const [UGLData, GetUGLData] = React.useState([{transaction_date: "Backend Unreachable", stock_id: "Backend Unreachable", stock_name: "Backend Unreachable", transaction_price: "Backend Unreachable", investment_cost: "Backend Unreachable"}]);

  React.useEffect(() => {
    const data = mainJS.getUnrealizedGainsLossesData();
    data.then((result) => {
      GetUGLData(result);
    });
  }, []);


  return (
    <>
      <Head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>股票交易紀錄</title>
        <link rel="stylesheet" href="/css/main.css"></link>
      </Head>
      <main>
        <nav class="nav-menu">
          <a href="#">證券交易</a>
        </nav>

        <nav class="sub-nav">
          <a href="/">首頁</a>
          <a href="/unrealized_gains_losses">未實現損益紀錄</a>
          <a href="/realized_gains_losses">已實現損益紀錄</a>
        </nav>
        <table id="stock-table">
            <thead>
                <tr>
                    <th>transaction_date</th>
                    <th>stock_id</th>
                    <th>stock_name</th>
                    <th>transaction_price</th>
                    <th>investment_cost</th>
                </tr>
            </thead>
            <tbody>
              {UGLData.map((item) => (
                <tr>
                  <td>{item.transaction_date}</td>
                  <td>{item.stock_id}</td>
                  <td>{item.stock_name}</td>
                  <td>{item.transaction_price}</td>
                  <td>{item.investment_cost}</td>
                </tr>
              ))}
            </tbody>
        </table>

        <div class="summary">
            <p>投資成本：<span id="total-cost">-</span></p>
            <p>帳面收入：<span id="total-income">-</span></p>
            <p>損益：<span id="total-profit-loss">-</span></p>
            <p>報酬率：<span id="return-rate">-</span></p>
        </div>
      </main>
    </>
  );
}