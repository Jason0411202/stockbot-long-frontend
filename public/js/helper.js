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