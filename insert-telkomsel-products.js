import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Function to prompt for input
const prompt = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Initialize Supabase client with fallback to user input
let supabaseUrl = process.env.VITE_SUPABASE_URL || '';
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

(async () => {
  if (!supabaseUrl) {
    supabaseUrl = await prompt('Enter your Supabase URL: ');
  }
  if (!supabaseKey) {
    supabaseKey = await prompt('Enter your Supabase Anonymous Key: ');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Telkomsel products data
  const products = [
    { name: 'Telkomsel 2.000', description: 'Reguler', price: 2105, fp_price: 2815 },
    { name: 'Telkomsel 3.000', description: 'Reguler', price: 2818, fp_price: 3815 },
    { name: 'Telkomsel 4.000', description: 'Reguler', price: 3700, fp_price: 4710 },
    { name: 'Telkomsel 5.000', description: 'Reguler', price: 4000, fp_price: 4905 },
    { name: 'Telkomsel 6.000', description: 'Reguler', price: 6430, fp_price: 6575 },
    { name: 'Telkomsel 7.000', description: 'Reguler', price: 7430, fp_price: 7575 },
    { name: 'Telkomsel 8.000', description: 'Reguler', price: 8430, fp_price: 8575 },
    { name: 'Telkomsel 10.000', description: 'Reguler', price: 8455, fp_price: 9780 },
    { name: 'Telkomsel 9.000', description: 'Reguler', price: 9430, fp_price: 9815 },
    { name: 'Telkomsel 11.000', description: 'Reguler', price: 11460, fp_price: null },
    { name: 'Telkomsel 12.000', description: 'Reguler', price: 12460, fp_price: null },
    { name: 'Telkomsel 13.000', description: 'Reguler', price: 13460, fp_price: null },
    { name: 'Telkomsel 15.000', description: 'Reguler', price: 14000, fp_price: 14785 },
    { name: 'Telkomsel 14.000', description: 'Reguler', price: 14460, fp_price: null },
    { name: 'Telkomsel 16.000', description: 'Reguler', price: 15911, fp_price: null },
    { name: 'Telkomsel 17.000', description: 'Reguler', price: 17460, fp_price: null },
    { name: 'Telkomsel 18.000', description: 'Reguler', price: 18060, fp_price: null },
    { name: 'Telkomsel 20.000', description: 'Reguler', price: 18460, fp_price: 19765 },
    { name: 'Telkomsel 19.000', description: 'Reguler', price: 19060, fp_price: null },
    { name: 'Telkomsel 21.000', description: 'Reguler', price: 20895, fp_price: null },
    { name: 'Telkomsel 22.000', description: 'Reguler', price: 21890, fp_price: null },
    { name: 'Telkomsel 23.000', description: 'Reguler', price: 22918, fp_price: null },
    { name: 'Telkomsel 25.000', description: 'Reguler', price: 23450, fp_price: 24680 },
    { name: 'Telkomsel 24.000', description: 'Reguler', price: 23795, fp_price: null },
    { name: 'Telkomsel 26.000', description: 'Reguler', price: 25713, fp_price: 25965 },
    { name: 'Telkomsel 27.000', description: 'Reguler', price: 26686, fp_price: 26960 },
    { name: 'Telkomsel 28.000', description: 'Reguler', price: 27689, fp_price: 27900 },
    { name: 'Telkomsel 30.000', description: 'Reguler', price: 28475, fp_price: 29505 },
    { name: 'Telkomsel 29.000', description: 'Reguler', price: 28677, fp_price: 28890 },
    { name: 'Telkomsel 31.000', description: 'Reguler', price: 30653, fp_price: 30950 },
    { name: 'Telkomsel 32.000', description: 'Reguler', price: 31641, fp_price: 31860 },
    { name: 'Telkomsel 33.000', description: 'Reguler', price: 32614, fp_price: 32860 },
    { name: 'Telkomsel 34.000', description: 'Reguler', price: 33617, fp_price: 33860 },
    { name: 'Telkomsel 35.000', description: 'Reguler', price: 33975, fp_price: 34623 },
    { name: 'Telkomsel 36.000', description: 'Reguler', price: 35593, fp_price: 35850 },
    { name: 'Telkomsel 37.000', description: 'Reguler', price: 36581, fp_price: 36810 },
    { name: 'Telkomsel 38.000', description: 'Reguler', price: 37569, fp_price: 37850 },
    { name: 'Telkomsel 39.000', description: 'Reguler', price: 38557, fp_price: 38850 },
    { name: 'Telkomsel 40.000', description: 'Reguler', price: 38875, fp_price: 39075 },
    { name: 'Telkomsel 41.000', description: 'Reguler', price: 40533, fp_price: 40860 },
    { name: 'Telkomsel 42.000', description: 'Reguler', price: 41521, fp_price: 41845 },
    { name: 'Telkomsel 43.000', description: 'Reguler', price: 42494, fp_price: 42800 },
    { name: 'Telkomsel 44.000', description: 'Reguler', price: 43497, fp_price: 43820 },
    { name: 'Telkomsel 45.000', description: 'Reguler', price: 44175, fp_price: 44493 },
    { name: 'Telkomsel 46.000', description: 'Reguler', price: 45473, fp_price: 45750 },
    { name: 'Telkomsel 47.000', description: 'Reguler', price: 46446, fp_price: 46750 },
    { name: 'Telkomsel 50.000', description: 'Reguler', price: 47000, fp_price: 49295 },
    { name: 'Telkomsel 48.000', description: 'Reguler', price: 47449, fp_price: 47770 },
    { name: 'Telkomsel 49.000', description: 'Reguler', price: 48437, fp_price: 48800 },
    { name: 'Telkomsel 51.000', description: 'Reguler', price: 50413, fp_price: 50820 },
    { name: 'Telkomsel 52.000', description: 'Reguler', price: 51401, fp_price: 51813 },
    { name: 'Telkomsel 53.000', description: 'Reguler', price: 52199, fp_price: 52807 },
    { name: 'Telkomsel 54.000', description: 'Reguler', price: 53362, fp_price: 53800 },
    { name: 'Telkomsel 55.000', description: 'Reguler', price: 54275, fp_price: 54365 },
    { name: 'Telkomsel 56.000', description: 'Reguler', price: 55353, fp_price: 55887 },
    { name: 'Telkomsel 57.000', description: 'Reguler', price: 56151, fp_price: 56880 },
    { name: 'Telkomsel 58.000', description: 'Reguler', price: 57329, fp_price: 57873 },
    { name: 'Telkomsel 59.000', description: 'Reguler', price: 58127, fp_price: 58867 },
    { name: 'Telkomsel 60.000', description: 'Reguler', price: 59175, fp_price: 59300 },
    { name: 'Telkomsel 61.000', description: 'Reguler', price: 60103, fp_price: 60650 },
    { name: 'Telkomsel 62.000', description: 'Reguler', price: 61281, fp_price: 61650 },
    { name: 'Telkomsel 63.000', description: 'Reguler', price: 62269, fp_price: 62600 },
    { name: 'Telkomsel 64.000', description: 'Reguler', price: 63242, fp_price: 63700 },
    { name: 'Telkomsel 65.000', description: 'Reguler', price: 64075, fp_price: 64238 },
    { name: 'Telkomsel 66.000', description: 'Reguler', price: 65043, fp_price: 65600 },
    { name: 'Telkomsel 67.000', description: 'Reguler', price: 66031, fp_price: 66550 },
    { name: 'Telkomsel 68.000', description: 'Reguler', price: 67209, fp_price: 67520 },
    { name: 'Telkomsel 69.000', description: 'Reguler', price: 68007, fp_price: 68600 },
    { name: 'Telkomsel 70.000', description: 'Reguler', price: 68375, fp_price: 69173 },
    { name: 'Telkomsel 71.000', description: 'Reguler', price: 70173, fp_price: 70600 },
    { name: 'Telkomsel 72.000', description: 'Reguler', price: 71161, fp_price: 71570 },
    { name: 'Telkomsel 73.000', description: 'Reguler', price: 72149, fp_price: 72570 },
    { name: 'Telkomsel 75.000', description: 'Reguler', price: 72550, fp_price: 72850 },
    { name: 'Telkomsel 74.000', description: 'Reguler', price: 73119, fp_price: 73570 },
    { name: 'Telkomsel 76.000', description: 'Reguler', price: 75113, fp_price: 75500 },
    { name: 'Telkomsel 77.000', description: 'Reguler', price: 76084, fp_price: 76500 },
    { name: 'Telkomsel 78.000', description: 'Reguler', price: 77072, fp_price: 77500 },
    { name: 'Telkomsel 79.000', description: 'Reguler', price: 78060, fp_price: 78500 },
    { name: 'Telkomsel 80.000', description: 'Reguler', price: 78725, fp_price: 79043 },
    { name: 'Telkomsel 85.000', description: 'Reguler', price: 79925, fp_price: 84120 },
    { name: 'Telkomsel 81.000', description: 'Reguler', price: 80036, fp_price: 80500 },
    { name: 'Telkomsel 82.000', description: 'Reguler', price: 81024, fp_price: 81500 },
    { name: 'Telkomsel 83.000', description: 'Reguler', price: 82012, fp_price: 82500 },
    { name: 'Telkomsel 84.000', description: 'Reguler', price: 83000, fp_price: 83500 },
    { name: 'Telkomsel 86.000', description: 'Reguler', price: 84978, fp_price: 85395 },
    { name: 'Telkomsel 87.000', description: 'Reguler', price: 85966, fp_price: 86395 },
    { name: 'Telkomsel 88.000', description: 'Reguler', price: 86953, fp_price: 87395 },
    { name: 'Telkomsel 89.000', description: 'Reguler', price: 87941, fp_price: 88395 },
    { name: 'Telkomsel 90.000', description: 'Reguler', price: 88575, fp_price: 88913 },
    { name: 'Telkomsel 91.000', description: 'Reguler', price: 89917, fp_price: 90350 },
    { name: 'Telkomsel 92.000', description: 'Reguler', price: 90909, fp_price: 91350 },
    { name: 'Telkomsel 93.000', description: 'Reguler', price: 91893, fp_price: 92350 },
    { name: 'Telkomsel 94.000', description: 'Reguler', price: 92881, fp_price: 93350 },
    { name: 'Telkomsel 95.000', description: 'Reguler', price: 93500, fp_price: 93848 },
    { name: 'Telkomsel 100.000', description: 'Reguler', price: 94775, fp_price: 97580 },
    { name: 'Telkomsel 96.000', description: 'Reguler', price: 94857, fp_price: 95295 },
    { name: 'Telkomsel 97.000', description: 'Reguler', price: 95844, fp_price: 96295 },
    { name: 'Telkomsel 98.000', description: 'Reguler', price: 96831, fp_price: 97295 },
    { name: 'Telkomsel 99.000', description: 'Reguler', price: 97818, fp_price: 98295 },
    { name: 'Telkomsel 105.000', description: 'Reguler', price: 100100, fp_price: null },
    { name: 'Telkomsel 110.000', description: 'Reguler', price: 108685, fp_price: null },
    { name: 'Telkomsel 115.000', description: 'Reguler', price: 113620, fp_price: null },
    { name: 'Telkomsel 120.000', description: 'Reguler', price: 118555, fp_price: null },
    { name: 'Telkomsel 125.000', description: 'Reguler', price: 123490, fp_price: null },
    { name: 'Telkomsel 130.000', description: 'Reguler', price: 128465, fp_price: null },
    { name: 'Telkomsel 135.000', description: 'Reguler', price: 133360, fp_price: null },
    { name: 'Telkomsel 140.000', description: 'Reguler', price: 138295, fp_price: 139775 },
    { name: 'Telkomsel 145.000', description: 'Reguler', price: 143270, fp_price: null },
    { name: 'Telkomsel 150.000', description: 'Reguler', price: 144950, fp_price: 144950 },
    { name: 'Telkomsel 155.000', description: 'Reguler', price: 153100, fp_price: null },
    { name: 'Telkomsel 160.000', description: 'Reguler', price: 158035, fp_price: null },
    { name: 'Telkomsel 165.000', description: 'Reguler', price: 162970, fp_price: null },
    { name: 'Telkomsel 170.000', description: 'Reguler', price: 167905, fp_price: null },
    { name: 'Telkomsel 175.000', description: 'Reguler', price: 172840, fp_price: null },
    { name: 'Telkomsel 180.000', description: 'Reguler', price: 177775, fp_price: null },
    { name: 'Telkomsel 185.000', description: 'Reguler', price: 182710, fp_price: null },
    { name: 'Telkomsel 190.000', description: 'Reguler', price: 187645, fp_price: null },
    { name: 'Telkomsel 195.000', description: 'Reguler', price: 192590, fp_price: null },
    { name: 'Telkomsel 200.000', description: 'Reguler', price: 193197, fp_price: 193250 },
    { name: 'Telkomsel 205.000', description: 'Reguler', price: 202460, fp_price: null },
    { name: 'Telkomsel 210.000', description: 'Reguler', price: 207395, fp_price: null },
    { name: 'Telkomsel 215.000', description: 'Reguler', price: 212330, fp_price: null },
    { name: 'Telkomsel 220.000', description: 'Reguler', price: 217265, fp_price: null },
    { name: 'Telkomsel 225.000', description: 'Reguler', price: 222200, fp_price: null },
    { name: 'Telkomsel 230.000', description: 'Reguler', price: 227135, fp_price: null },
    { name: 'Telkomsel 235.000', description: 'Reguler', price: 232180, fp_price: null },
    { name: 'Telkomsel 240.000', description: 'Reguler', price: 237005, fp_price: null },
    { name: 'Telkomsel 245.000', description: 'Reguler', price: 241940, fp_price: null },
    { name: 'Telkomsel 250.000', description: 'Reguler', price: 246875, fp_price: null },
    { name: 'Telkomsel 275.000', description: 'Reguler', price: 272425, fp_price: null },
    { name: 'Telkomsel 300.000', description: 'Reguler', price: 289920, fp_price: 290245 },
    { name: 'Telkomsel 325.000', description: 'Reguler', price: 322200, fp_price: null },
    { name: 'Telkomsel 350.000', description: 'Reguler', price: 346975, fp_price: null },
    { name: 'Telkomsel 375.000', description: 'Reguler', price: 372000, fp_price: null },
    { name: 'Telkomsel 400.000', description: 'Reguler', price: 396000, fp_price: null },
    { name: 'Telkomsel 425.000', description: 'Reguler', price: 419600, fp_price: null },
    { name: 'Telkomsel 450.000', description: 'Reguler', price: 419968, fp_price: null },
    { name: 'Telkomsel 475.000', description: 'Reguler', price: 469300, fp_price: null },
    { name: 'Telkomsel 500.000', description: 'Reguler', price: 469373, fp_price: 495500 },
    { name: 'Telkomsel 1.000.000', description: 'Reguler', price: 988000, fp_price: 990525 },
  ];

  async function insertProducts() {
    try {
      console.log('Starting product insertion...');
      const { data, error } = await supabase
        .from('products')
        .insert(products.map(product => ({
          name: product.name,
          description: product.description,
          price: product.price,
          fp_price: product.fp_price,
          category: 'Pulsa',
          provider: 'Telkomsel',
          active: true
        })));
      
      if (error) {
        console.error('Error inserting products:', error);
        return;
      }
      
      console.log('Products inserted successfully:', data?.length, 'records inserted');
    } catch (err) {
      console.error('Exception while inserting products:', err);
    }
  }

  await insertProducts();
})();
