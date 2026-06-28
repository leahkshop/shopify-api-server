require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'unnie-k-shop';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = '2024-01';

const shopifyAPI = axios.create({
  baseURL: `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}`,
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  }
});

app.post('/api/add-mts-section', async (req, res) => {
  try {
    const { themeId } = req.body;
    
    if (!themeId) {
      return res.status(400).json({ error: 'themeId required' });
    }

    const mtsSection = {
      type: 'featured_collection',
      settings: {
        title: 'MTS Products',
        collection: 'mts-products',
        products_count: 4,
        color_scheme: 'background-1',
        image_ratio: 'portrait',
        text_alignment: 'center'
      }
    };

    const response = await shopifyAPI.get(`/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`);
    
    let settingsData = JSON.parse(response.data.asset.value);
    
    if (!settingsData.sections) {
      settingsData.sections = {};
    }
    
    const sectionId = `mts-products-${Date.now()}`;
    settingsData.sections[sectionId] = mtsSection;
    
    const updateResponse = await shopifyAPI.put(`/themes/${themeId}/assets.json`, {
      asset: {
        key: 'config/settings_data.json',
        value: JSON.stringify(settingsData, null, 2)
      }
    });

    res.json({ 
      success: true, 
      message: 'MTS Products section added',
      sectionId 
    });

  } catchindex.js 
