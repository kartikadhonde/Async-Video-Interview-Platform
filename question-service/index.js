require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');

const PORT = process.env.PORT || 3008;

app.listen(PORT, () => {
    console.log(`Question Service running on port ${PORT}`);
});
