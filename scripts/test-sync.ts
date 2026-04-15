const API_URL = 'http://localhost:3001/v1';
const API_KEY = 'vinyl_test_key_2026';

async function main() {
  console.log('🚀 Iniciando teste de sincronização de orçamentos (Mobile -> API)...');

  const payload = {
    quotations: [
      {
        localId: 'mobile-uuid-1234',
        customerName: 'Cliente Teste Mobile',
        totalAmount: 650.00,
        totalCost: 200.00,
        totalServiceCommission: 65.00, // 10%
        serviceCommissionRate: 10.0,
        profit: 385.00,
        margin: 59.2,
        items: [
          {
            serviceTypeId: 'serv-test-1',
            materialId: 'mat-test-1',
            width: 2.0,
            height: 1.5,
            quantity: 1,
            price: 650.00,
            cost: 200.00
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(`${API_URL}/quotations/sync`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok) {
        console.log('✅ Resposta da API:');
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.error('❌ Erro da API:');
        console.error(JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.error('❌ Erro ao conectar:');
    console.error(error.message);
  }
}

main();

