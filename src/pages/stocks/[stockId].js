import React from "react";

import * as mainJS from "@/../public/js/helper.js";

export default function StockPage({ props }) {
  return (
    <div>
      <h1>Hello</h1>
    </div>
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
export async function getStaticProps() {
    return {
      props: {
        REACT_APP_backendServer: process.env.REACT_APP_backendServer,
      }
    };
  }