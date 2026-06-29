// 환경 변수 로드 (반드시 가장 먼저)
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 환경 변수 확인
const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'unnie-k-shop';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';
const THEME_ID = '136149795068'; // Unnie K-Shop의 테마 ID

console.log('=== Shopify API Server Started ===');
console.log('Store:', SHOPIFY_STORE);
console.log('Token:', SHOPIFY_ACCESS_TOKEN ? '✅ Set' : '❌ Not Set');
console.log('Theme ID:', THEME_ID);
console.log('=====================================');

// 건강 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    store: SHOPIFY_STORE,
    tokenSet: !!SHOPIFY_ACCESS_TOKEN
  });
});

// MTS Products 섹션 추가 API
app.post('/api/add-mts-section', async (req, res) => {
  try {
    if (!SHOPIFY_ACCESS_TOKEN) {
      return res.status(400).json({ 
        error: 'SHOPIFY_ACCESS_TOKEN is not set',
        message: 'Please configure the access token in Railway variables'
      });
    }

    const { themeId } = req.body || {};
    const targetThemeId = themeId || THEME_ID;

    console.log(`\n📝 Adding MTS Products section...`);
    console.log('Theme ID:', targetThemeId);

    // 1. 현재 settings_data.json 가져오기
    const settingsUrl = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/themes/${targetThemeId}/assets.json?asset[key]=config/settings_data.json`;
    
    const getResponse = await axios.get(settingsUrl, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    let settingsData = {};
    if (getResponse.data.asset && getResponse.data.asset.value) {
      settingsData = JSON.parse(getResponse.data.asset.value);
    }

    // 2. sections 배열 확인 및 MTS 섹션 추가
    if (!settingsData.sections) {
      settingsData.sections = {};
    }

    // 3. MTS Products 섹션 설정
    const mtsSection = {
      type: 'mts-products',
      settings: {
        heading: 'MTS Products',
        product_limit: 8
      }
    };

    // 기존 sections를 유지하면서 MTS 섹션 추가
    const sectionKey = `mts-products-${Date.now()}`;
    settingsData.sections[sectionKey] = mtsSection;

    console.log('✅ MTS Section added:', sectionKey);

    // 4. 수정된 settings_data.json 업로드
    const putResponse = await axios.put(settingsUrl, {
      asset: {
        key: 'config/settings_data.json',
        value: JSON.stringify(settingsData)
      }
    }, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Settings updated successfully!');
    console.log('Section Key:', sectionKey);

    res.json({
      success: true,
      message: 'MTS Products section added to homepage',
      sectionKey: sectionKey,
      themeId: targetThemeId,
      store: SHOPIFY_STORE
    });

  } catch (error) {
    console.error('❌ Error adding MTS section:', error.message);
    if (error.response) {
      console.error('Shopify API Error:', error.response.data);
    }
    
    res.status(500).json({
      error: 'Failed to add MTS section',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`\n🚀 Shopify API Server running on port ${PORT}`);
  console.log(`\n📍 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/add-mts-section`);
  console.log(`\n🔗 Server URL: http://localhost:${PORT}`);
});

// 에러 핸들러
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
