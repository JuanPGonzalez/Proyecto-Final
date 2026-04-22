const axios = require('axios');

let mlTokenData = null;

async function refreshToken() {
  if (!mlTokenData?.refresh_token) {
    console.log('🔄 No hay refresh_token disponible. Pidiendo logueo manual.');
    return;
  }

  try {
    const response = await axios.post(
      'https://api.mercadolibre.com/oauth/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
        refresh_token: mlTokenData.refresh_token,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    mlTokenData = response.data;
    console.log('🔄 Token actualizado / Refrescado con éxito.');
  } catch (err) {
    console.error('❌ Error actualizando el ML token:', err.message);
  }
}

async function fetchItemFromML(id) {
  try {
    // 1. Intentar como ITEM
    const res = await axios.get(`https://api.mercadolibre.com/items/${id}`);

    return {
      price: res.data.price,
      title: res.data.title,
      status: res.data.status,
    };

  } catch (error) {

    // 2. Si falla → intentar como PRODUCTO
    try {
      const res = await axios.get(`https://api.mercadolibre.com/products/${id}`);

      const item = res.data.buy_box_winner;

      if (!item) return null;

      return {
        price: item.price,
        title: res.data.name,
        status: item.status,
      };

    } catch (err) {
      console.error('[ML ERROR]', id);
      return null;
    }
  }
}

module.exports = {
  fetchItemFromML,
  setTokenData: (data) => { mlTokenData = data; },
  getTokenData: () => mlTokenData
};
