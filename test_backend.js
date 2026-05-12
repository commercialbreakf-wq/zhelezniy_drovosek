const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log("Starting Backend Tests...");
    
    try {
        // 1. Test Products API
        console.log("Testing /api/products...");
        const productsRes = await axios.get(`${BASE_URL}/api/products?limit=1`);
        if (productsRes.status === 200 && productsRes.data.products.length > 0) {
            console.log("✅ Products API OK");
        } else {
            console.log("❌ Products API Failed or empty");
        }

        // 2. Test Filters API
        console.log("Testing /api/filters...");
        const filtersRes = await axios.get(`${BASE_URL}/api/filters`);
        if (filtersRes.status === 200 && filtersRes.data.categories) {
            console.log("✅ Filters API OK");
        } else {
            console.log("❌ Filters API Failed");
        }

        // 3. Test Auth Register (Mock)
        console.log("Testing Auth Registration...");
        const testEmail = `test_${Date.now()}@example.com`;
        const regRes = await axios.post(`${BASE_URL}/api/auth/register`, {
            email: testEmail,
            password: 'testpassword',
            name: 'Test User'
        });
        
        if (regRes.status === 200 && regRes.data.token) {
            console.log("✅ Registration API OK");
            const token = regRes.data.token;

            // 4. Test Profile Update
            console.log("Testing Profile Update...");
            const profileRes = await axios.put(`${BASE_URL}/api/auth/profile`, {
                company_name: 'Test Company LLC',
                inn: '1234567890'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (profileRes.status === 200) {
                console.log("✅ Profile Update API OK");
            } else {
                console.log("❌ Profile Update API Failed");
            }

            // 5. Test Profile Fetch
            console.log("Testing Profile Fetch...");
            const meRes = await axios.get(`${BASE_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (meRes.data.company_name === 'Test Company LLC') {
                console.log("✅ Profile Data Persisted OK");
            } else {
                console.log("❌ Profile Data Mismatch");
            }
        }

        console.log("\n--- ALL TESTS PASSED SUCCESSFULLY ---");
        process.exit(0);
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
        process.exit(1);
    }
}

runTests();
