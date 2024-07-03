export function getUnrealizedGainsLossesData(id) {
  return fetch('http://localhost:8000/api/get_unrealized_gains_losses')
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
    return [{transaction_date: "Backend Unreachable", stock_id: "Backend Unreachable", stock_name: "Backend Unreachable", transaction_price: "Backend Unreachable", investment_cost: "Backend Unreachable"}]
  });
}

export function getRealizedGainsLossesData(id) {
  return fetch('http://localhost:8000/api/get_realized_gains_losses')
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