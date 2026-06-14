const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Cho phép Web HTML của sếp gọi sang mà không bị lỗi CORS
app.use(cors());

app.get('/unshorten', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'Chưa nhập URL kìa sếp!' });

    try {
        // Gõ cửa Shopee bằng axios, cấm nó auto-redirect để chộp header Location
        const response = await axios.get(targetUrl, {
            maxRedirects: 0, 
            validateStatus: function (status) {
                return status >= 200 && status < 400; // Cho qua các mã 301, 302
            },
            headers: {
                // Đóng giả iPhone để Shopee không nghi ngờ
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
            }
        });

        let finalUrl = targetUrl;
        
        // Chộp link dài từ header location
        if (response.status >= 300 && response.status < 400) {
            finalUrl = response.headers.location || targetUrl;
        }

        // Nếu Shopee ném ra Universal Link, bóc lõi origin_link ra
        if (finalUrl.includes('origin_link=')) {
            try {
                const urlObj = new URL(finalUrl);
                const origin = urlObj.searchParams.get('origin_link');
                if (origin) finalUrl = decodeURIComponent(origin);
            } catch(e) {}
        }

        // Trả link dài sạch sẽ (cắt bỏ phần params nhảm nhí sau dấu ?) về cho Web
        res.json({ longUrl: finalUrl.split('?')[0] });

    } catch (error) {
        console.error("Lỗi Unshorten:", error.message);
        // Lỗi thì vẫn trả về link gốc, không làm sập web
        res.json({ longUrl: targetUrl }); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Trạm Dập Link đang chạy ở cổng ${PORT}`));