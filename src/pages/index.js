import React from "react";

import Head from "next/head";
import * as mainJS from "@/../public/js/helper.js";

export default function Home(props) {
  const [UGLData, GetUGLData] = React.useState([{transaction_date: "Backend Unreachable", stock_id: "Backend Unreachable", stock_name: "Backend Unreachable", transaction_price: "Backend Unreachable", investment_cost: "Backend Unreachable"}]);

  React.useEffect(() => {
    const data = mainJS.getUnrealizedGainsLossesData(props);
    data.then((result) => {
      GetUGLData(result);
    });
  }, []);


  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>長線股票模擬交易系統</title>
        <link rel="stylesheet" href="/css/mainpage.css"></link>
      </Head>
      <main>
        <div class="container">
          <h1>長線股票模擬交易系統</h1>
          <div class="links">
              <a href="/unrealized_gains_losses" class="link-button">未實現損益紀錄</a>
              <a href="/realized_gains_losses" class="link-button">已實現損益紀錄</a>
          </div>
        </div>
        <div class="geometric-bg"></div>
      </main>
    </>
  );
}
