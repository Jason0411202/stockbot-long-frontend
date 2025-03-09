// 透過後端 api 取得未實現損益資料
// 回傳格式範例:
// [
//   {
//     "investment_cost": 580,
//     "now_value": 0,
//     "predict_profit_loss": -580,
//     "predict_profit_rate": -100,
//     "stock_id": "2330",
//     "stock_name": "台積電",
//     "todayClosePrice": 0,
//     "transaction_date": "2025-03-06",
//     "transaction_price": 600.5
//   },
//   {
//     "investment_cost": 580,
//     "now_value": 37.4,
//     "predict_profit_loss": -542.6,
//     "predict_profit_rate": -93.55,
//     "stock_id": "00830",
//     "stock_name": "美股",
//     "todayClosePrice": 38.72,
//     "transaction_date": "2025-03-06",
//     "transaction_price": 600.5
//   }
// ]
export function getUnrealizedGainsLossesData(props) {
  const REACT_APP_backendServer = props.REACT_APP_backendServer;
  return fetch('https://' + REACT_APP_backendServer +'/api/get_unrealized_gains_losses')
  .then(response => {
    if (!response.ok) {
      throw new Error('獲取 response 失敗');
    }
    return response.json();
  })
  .then(data => {
    return data;
  })
  .catch(error => {
    console.error('錯誤：', error);
    return [{transaction_date: "Backend Unreachable", stock_id: "Backend Unreachable", stock_name: "Backend Unreachable", transaction_price: "Backend Unreachable", investment_cost: "Backend Unreachable", todayClosePrice: "Backend Unreachable", now_value: "Backend Unreachable", predict_profit_loss: "Backend Unreachable", predict_profit_rate: "Backend Unreachable"}]
  });
}

export function getRealizedGainsLossesData(props) {
  const REACT_APP_backendServer = props.REACT_APP_backendServer;
  return fetch('https://' + REACT_APP_backendServer +'/api/get_realized_gains_losses')
  .then(response => {
    if (!response.ok) {
      throw new Error('獲取 response 失敗');
    }
    return response.json();
  })
  .then(data => {
    return data;
  })
  .catch(error => {
    console.error('錯誤：', error);
    return [{buy_date: "Backend Unreachable", sell_date: "Backend Unreachable", stock_id: "Backend Unreachable", stock_name: "Backend Unreachable", purchase_price: "Backend Unreachable", sell_price: "Backend Unreachable", investment_cost: "Backend Unreachable", revenue: "Backend Unreachable", profit_loss: "Backend Unreachable", profit_rate: "Backend Unreachable"}]
  });
}

export function getSotckStatisticData(props) {
  const REACT_APP_backendServer = props.REACT_APP_backendServer;
  return fetch('https://' + REACT_APP_backendServer +'/api/get_stock_statistic_data')
  .then(response => {
    if (!response.ok) {
      throw new Error('獲取 response 失敗');
    }
    return response.json();
  })
  .then(data => {
    return data;
  })
  .catch(error => {
    console.error('錯誤：', error);
    return [{stock_id: "Backend Unreachable", stock_name: "Backend Unreachable", today_price: "Backend Unreachable", lower_point_days: "Backend Unreachable", upper_point_days: "Backend Unreachable"}]
  });
}

export function getStockHistoryAndDrowPointData(props) {
  const REACT_APP_backendServer = props.REACT_APP_backendServer;
  const stockId = props.stockId;

  // 透過後端 api 取得股票歷史資料
  return fetch(`https://${REACT_APP_backendServer}/api/get_stock_history_data?stockId=${stockId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('獲取股票歷史資料 response 失敗');
      }
      return response.json();
    })
    .then(historyData => {
      // 透過後端 api 取得未實現損益資料
      return fetch(`https://${REACT_APP_backendServer}/api/get_unrealized_gains_losses`)
        .then(response => {
          if (!response.ok) {
            throw new Error('獲取未實現損益 response 失敗');
          }
          return response.json();
        })
        .then(unrealizedGainsLossesData => {
          // 用 Map 儲存交易日期與投資成本的對應關係
          const unrealizedGainsLossesTransactions = new Map(
            unrealizedGainsLossesData
              .filter(item => item.stock_id === stockId)
              .map(item => [item.transaction_date, item.investment_cost])
          );

          // 更新歷史資料，加入未實現損益資訊
          var updatedHistory = historyData.map(entry => ({
            ...entry,
            unrealizedInvestmentCost: unrealizedGainsLossesTransactions.get(entry.date) || 0,
          }));

          // 透過後端 api 取得已實現損益資料
          return fetch(`https://${REACT_APP_backendServer}/api/get_realized_gains_losses`)
            .then(response => {
              if (!response.ok) {
                throw new Error('獲取已實現損益 response 失敗');
              }
              return response.json();
            })
            .then(realizedGainsLossesData => {
              // 用 Map 儲存已實現交易的買入日期與投資成本的對應關係
              const realizedTransactions = new Map(
                realizedGainsLossesData
                  .filter(item => item.stock_id === stockId)
                  .map(item => [item.buy_date, item.investment_cost])
              );

              // 更新歷史資料，加入已實現損益資訊
              updatedHistory = updatedHistory.map(entry => ({
                ...entry,
                realizedInvestmentCost: realizedTransactions.get(entry.date) || 0,
              }));

              const realizedRevenue = realizedGainsLossesData
                  .filter(item => item.stock_id === stockId)
                  .reduce((map, item) => {
                    const currentProfit = map.get(item.sell_date) || 0;
                    map.set(item.sell_date, currentProfit + item.revenue);
                    return map;
                  }, new Map());

                // 更新歷史資料，加入已實現總收益資訊
                updatedHistory = updatedHistory.map(entry => ({
                  ...entry,
                  realizedRevenue: realizedRevenue.get(entry.date) || 0,
                }));

              return updatedHistory;
            });
        });
    })
    .catch(error => {
      console.error('錯誤：', error);
      return Array.from({ length: 5 * 365 }, () => ({
        date: "0",
        price: 0,
        unrealizedInvestmentCost: 0,
        realizedInvestmentCost: 0,
        realizedRevenue: 0,
      }));
    });
}


export function getSummary(props) {
  let totalCost = 0;
  let totalProfitLoss = 0;
  let totalReturnRate = 0;
 
  props.map((item) => {
    totalCost += parseFloat(item.investment_cost);

    // 若 item.predict_profit_loss 存在
    if(item.predict_profit_loss) {
      totalProfitLoss += parseFloat(item.predict_profit_loss);
    } else {
      totalProfitLoss += parseFloat(item.profit_loss);
    }
  });
  totalReturnRate = (totalProfitLoss / totalCost * 100);

  return [{total_cost: totalCost.toFixed(2), total_profit_loss: totalProfitLoss.toFixed(2), return_rate: totalReturnRate.toFixed(2)}];
}