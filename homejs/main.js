import { createServer } from 'http';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const productsPath = join(process.cwd(), 'data/products.json');

async function getProducts() {
    try {
        const data = await readFile(productsPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.log(`Mahsulotlarni oqishda xato: ${error.message}`);
        return [];
    }
}

async function writeProducts(data) {
    try {
        await writeFile(productsPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.log(`Mahsulotlarni yozishda xato: ${error.message}`);
    }
}

const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { method, url } = req;

    // GET 
    if (url === '/products' && method === 'GET') {
        const products = await getProducts();
        res.writeHead(200);
        return res.end(JSON.stringify(products));
    }

    // GET 
    if (url.startsWith('/products/') && method === 'GET') {
        const id = parseInt(url.split('/')[2]);
        const products = await getProducts();
        const product = products.find(p => p.id === id);

        if (!product) {
            res.writeHead(404);
            return res.end(JSON.stringify({ message: `Mahsulot topilmadi (ID: ${id})` }));
        }

        res.writeHead(200);
        return res.end(JSON.stringify(product));
    }

    // POST 
    if (url === '/products' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const newProduct = JSON.parse(body);
                if (!newProduct.name || !newProduct.price) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ message: "name va price majburiy!" }));
                }

                const products = await getProducts();
                const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
                const productToAdd = { id: newId, ...newProduct };

                products.push(productToAdd);
                await writeProducts(products);

                res.writeHead(201);
                res.end(JSON.stringify(productToAdd));
            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: "JSON formati noto‘g‘ri" }));
            }
        });
        return;
    }

    // PUT 
    if (url.startsWith('/products/') && method === 'PUT') {
        const id = parseInt(url.split('/')[2]);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const updateData = JSON.parse(body);
                const products = await getProducts();
                const index = products.findIndex(p => p.id === id);

                if (index === -1) {
                    res.writeHead(404);
                    return res.end(JSON.stringify({ message: `Mahsulot topilmadi (ID: ${id})` }));
                }

                products[index] = { ...products[index], ...updateData };
                await writeProducts(products);

                res.writeHead(200);
                res.end(JSON.stringify(products[index]));
            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: "JSON formati noto‘g‘ri" }));
            }
        });
        return;
    }

    // DELETE 
    if (url.startsWith('/products/') && method === 'DELETE') {
        const id = parseInt(url.split('/')[2]);
        const products = await getProducts();
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
            res.writeHead(404);
            return res.end(JSON.stringify({ message: `Mahsulot topilmadi (ID: ${id})` }));
        }

        const deleted = products.splice(index, 1)[0];
        await writeProducts(products);

        res.writeHead(200);
        res.end(JSON.stringify(deleted));
    }

    else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Sahifa topilmadi' }));
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Products API ishga tushdi: http://localhost:${PORT}`);
    console.log(`Vaqt: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`);
});