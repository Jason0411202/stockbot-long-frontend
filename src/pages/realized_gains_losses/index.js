import React from "react";

import Head from "next/head";
import * as mainJS from "@/../public/js/helper.js";

export default function Home() {
  const [UGLData, GetUGLData] = React.useState([{buy_date: "Backend Unreachable", sell_date: "Backend Unreachable", stock_id: "Backend Unreachable", stock_name: "Backend Unreachable", purchase_price: "Backend Unreachable", sell_price: "Backend Unreachable", investment_cost: "Backend Unreachable", revenue: "Backend Unreachable", profit_loss: "Backend Unreachable", profit_rate: "Backend Unreachable"}]);

  React.useEffect(() => {
    const data = mainJS.getRealizedGainsLossesData();
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
                    <th>買入日期</th>
                    <th>賣出日期</th>
                    <th>股票代號</th>
                    <th>股票名稱</th>
                    <th>買入價格</th>
                    <th>賣出價格</th>
                    <th>投資成本</th>
                    <th>總收益</th>
                    <th>損益</th>
                    <th>損益率</th>
                </tr>
            </thead>
            <tbody>
              {UGLData.map((item) => (
                <tr>
                  <td>{item.buy_date}</td>
                  <td>{item.sell_date}</td>
                  <td>{item.stock_id}</td>
                  <td>{item.stock_name}</td>
                  <td>{item.purchase_price}</td>
                  <td>{item.sell_price}</td>
                  <td>{item.investment_cost}</td>
                  <td>{item.revenue}</td>
                  <td>{item.profit_loss}</td>
                  <td>{item.profit_rate}</td>
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