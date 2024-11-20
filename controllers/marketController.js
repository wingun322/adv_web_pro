    const fetch = require("node-fetch");
    
    exports.ticker = async (req, res) => {
        try {
            const options = { method: 'GET', headers: { accept: 'application/json' } };
            let result
            const marketResponse = await fetch('https://api.bithumb.com/v1/market/all?isDetails=false', options);
            const marketData = await marketResponse.json();
    
            if (Array.isArray(marketData)) {
                const markets = marketData.map(item => item.market).join(',');
                const tickerResponse = await fetch(`https://api.bithumb.com/v1/ticker?markets=${markets}`, options);
                const tickerData = await tickerResponse.json();
    
                if (Array.isArray(tickerData)) {
                    result = tickerData.map(item => {
                        const marketInfo = marketData.find(marketItem => marketItem.market === item.market);
                        let priceColor;
                        if (item.change === 'EVEN') {
                            priceColor = 'black';  // 보합은 검은색
                        } else if (item.change === 'RISE') {
                            priceColor = 'red';  // 상승은 빨간색
                        } else if (item.change === 'FALL') {
                            priceColor = 'blue';  // 하락은 파란색
                        }
    
                        return {
                            market: item.market,
                            tradePrice: item.trade_price,
                            koreanName: marketInfo ? marketInfo.korean_name : 'N/A',
                            englishName: marketInfo ? marketInfo.english_name : 'N/A',
                            priceColor: priceColor
                        };
                    });
                    res.json(result);
                }
            } else {
                console.error('Expected an array in response');
                res.status(500).json({ error: 'Invalid response format from Bithumb' });
            }
        } catch (err) {
            console.error('Fetch error:', err);
            res.status(500).json({ error: 'Failed to fetch data' });
            }
    }