import React from "react";
import Head from "next/head";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import * as mainJS from "@/../public/js/helper.js";

Chart.register(...registerables);

export default function StockPage(props) {
  // 存放股價歷史資訊與買點資訊的變數
  const [StockHistoryData, GetStockHistoryAndDrowPointData] = React.useState(
    Array.from({ length: 5 * 365 }, () => ({ date: "0", price: 0, isSpecial: false }))
  );
  const [timeRange, setTimeRange] = React.useState("1m"); // 預設為 1 個月

  // 取得股價歷史資訊與買點資訊
  React.useEffect(() => {
    const data = mainJS.getStockHistoryAndDrowPointData(props);
    data.then((result) => {
      GetStockHistoryAndDrowPointData(result);
    });
  }, []);

  // 根據前端使用者選擇的時間範圍，過濾資料
  const filterDataByRange = (data) => {
    const today = new Date();
    const dateLimit = new Date(today);

    switch (timeRange) {
      case "1m":
        dateLimit.setMonth(today.getMonth() - 1);
        break;
      case "3m":
        dateLimit.setMonth(today.getMonth() - 3);
        break;
      case "6m":
        dateLimit.setMonth(today.getMonth() - 6);
        break;
      case "1y":
        dateLimit.setFullYear(today.getFullYear() - 1);
        break;
      case "3y":
      dateLimit.setFullYear(today.getFullYear() - 3);
      break;
      case "all":
      default:
        return data;
    }
    
    return data.filter((item) => new Date(item.date) >= dateLimit);
  };

  const filteredData = filterDataByRange(StockHistoryData);

  // 動態計算點的大小 (線性插值)
  const calculatePointSize = (value, Min, Max, base, range) => {
    if (Max === Min) return 10; // 若所有值相同，給予固定大小

    return (
      base +
      ((value - Min) / (Max - Min)) * range
    );
  };

  const investmestCostMinValue = Math.min(
    ...filteredData.flatMap(({ unrealizedInvestmentCost, realizedInvestmentCost, realizedRevenue }) => 
      [unrealizedInvestmentCost, realizedInvestmentCost, realizedRevenue].filter(v => v >= 1)
    )
  );
  
  const investmestCostMaxValue = Math.max(
    ...filteredData.flatMap(({ unrealizedInvestmentCost, realizedInvestmentCost, realizedRevenue }) => 
      [unrealizedInvestmentCost, realizedInvestmentCost, realizedRevenue]
    )
  );
  
  const unrealized_gains_losses_markedPoints = filteredData
    .filter((data) => data.unrealizedInvestmentCost > 0)
    .map((data) => ({
      x: data.date,
      y: data.price,
      cost: data.unrealizedInvestmentCost,
      radius: calculatePointSize(data.unrealizedInvestmentCost, investmestCostMinValue, investmestCostMaxValue, 5, 7),
    }));

  const realized_gains_losses_markedPoints = filteredData
    .filter((data) => data.realizedInvestmentCost > 0)
    .map((data) => ({
      x: data.date,
      y: data.price,
      cost: data.realizedInvestmentCost,
      radius: calculatePointSize(data.realizedInvestmentCost, investmestCostMinValue, investmestCostMaxValue, 5, 7),
    }));

  const realized_gains_losses_revenue_markedPoints = filteredData
  .filter((data) => data.realizedRevenue > 0)
  .map((data) => ({
    x: data.date,
    y: data.price,
    cost: data.realizedRevenue,
    radius: calculatePointSize(data.realizedRevenue, investmestCostMinValue, investmestCostMaxValue, 5, 7),
  }));




  const labels = filteredData.map((data) => data.date); // 取得日期
  const prices = filteredData.map((data) => data.price); // 取得股價
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "歷史賣出點",
        data: realized_gains_losses_revenue_markedPoints,
        pointStyle: "circle",
        pointRadius: realized_gains_losses_revenue_markedPoints.map((point) => point.radius), // 使用動態的點大小
        pointBackgroundColor: "#FF00FF",
        showLine: false,
      },
      {
        label: "歷史買入點 (已獲利了結)",
        data: realized_gains_losses_markedPoints,
        pointStyle: "circle",
        pointRadius: realized_gains_losses_markedPoints.map((point) => point.radius), // 使用動態的點大小
        pointBackgroundColor: "#00FF00",
        showLine: false,
      },
      {
        label: "歷史買入點 (未獲利了結)",
        data: unrealized_gains_losses_markedPoints,
        pointStyle: "circle",
        pointRadius: unrealized_gains_losses_markedPoints.map((point) => point.radius), // 使用動態的點大小
        pointBackgroundColor: "#ff0000",
        showLine: false,
      },
      {
        label: `${props.stockId} 當天股價`,
        data: prices,
        fill: false,
        borderColor: "#007bff",
        tension: 0.1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: false, // 關閉圖例
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const point = context.raw;
            const dataset = context.dataset;
  
            if (dataset.label === "歷史買入點 (已獲利了結)") {
              return `歷史買入點 (已獲利了結): ${point.cost}`;
            } else if (dataset.label === "歷史買入點 (未獲利了結)") {
              return `歷史買入點 (未獲利了結): ${point.cost}`;
            } else if (dataset.label === "歷史賣出點") {
              return `歷史賣出點: ${point.cost}`;
            }
          },
        },
      },
    },
  };

  return (
    <>
      <Head>
        <link rel="stylesheet" href="/css/StocksPage.css"></link>
      </Head>
      <main className="container">
        <h1>{props.stockId} 的歷史股價與買賣紀錄</h1>
        <div className="button-group">
          {["1m", "3m", "6m", "1y", "3y", "all"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={timeRange === range ? "active" : ""}
            >
              {range === "1m" ? "1個月" : 
               range === "3m" ? "3個月" : 
               range === "6m" ? "6個月" : 
               range === "1y" ? "1年" : 
               range === "3y" ? "3年" :"全部"}
            </button>
          ))}
        </div>
        
        <div className="chart-container">
          <Line 
            data={chartData} 
            options={options} 
          />
        </div>
      </main>
    </>
  );
}



// 是 next.js 的內建函式，動態路由的生成關鍵
// paths 是類似以下型態的"物件型態陣列"，須以特定格式撰寫
// 注意 params 中的 id 要與檔名"[]"中的名稱相同
// [
//   { params: { id: '1' } },
//   { params: { id: '2' } },
//   { params: { id: '3' } }
// ]
// next.js 底層透過這個函式的回傳值，來生成動態的路由
export async function getStaticPaths() {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // 在伺服器端執行時，Node.js 預設會拒絕自簽名憑證。為了避免 Error: self signed certificate in certificate chain 故加了這行
  const sotckStatisticData = await mainJS.getSotckStatisticData({REACT_APP_backendServer: process.env.REACT_APP_backendServer});

  const paths = sotckStatisticData.map((stock) => ({
      params: { stockId: stock.stock_id },
  }));

  return {
    paths,
    fallback: false,
  };
}

// 是 next.js 的內建函式。透過這個內建的函式，next.js 便可以取得呼叫外部 JS 檔案以取得靜態資料，並將結果經由底層函式傳遞給 default function
// params 來源於 getStaticPaths 的回傳值，也就是動態路由中定義的路徑參數 ({ params: { id: '1' } } 中的 params)
// postData 是一個物件，例如
// { ArticleId: '1', ArticleName: 'next.js tutorial' }
// 這個函式的回傳值會被傳遞給 default function
export async function getStaticProps({ params }) {
    console.log(params.stockId);
    return {
      props: {
        REACT_APP_backendServer: process.env.REACT_APP_backendServer,
        stockId: params.stockId,
      }
    };
  }