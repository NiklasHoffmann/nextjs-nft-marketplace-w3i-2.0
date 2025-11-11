// Direct test of the marketplace listing API
const contractAddress = '0x99576db3f507fd6c1c411699f05262bb6424bc8c';
const tokenId = '381';

const url = `http://localhost:3000/api/marketplace/listing/${contractAddress}/${tokenId}`;

console.log('Testing URL:', url);

fetch(url)
  .then(res => {
    console.log('Response status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Response data:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });
