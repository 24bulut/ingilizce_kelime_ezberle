const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();
const chalk = require('chalk');


const db = new sqlite3.Database('./words.db');


db.run(`CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    english TEXT,
    turkish TEXT,
    memorized BOOLEAN DEFAULT 0,
    true_count INTEGER DEFAULT 0,
    false_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function countWords() {

    db.get('SELECT COUNT(*) AS count FROM words', (err, row) => {
        if(err){
            console.error('Kelime sayısı alınırken bir hata oluştu:', err.message);
        } else {
            console.log('Şuana kadar eklenen kelime sayısı: ' + row.count);
        }
    });
}


function listAllWords() {
    countWords();
    console.log('-----------------------------------');

    db.all('SELECT * FROM words', (err, rows) => {
        if(err){
            console.error('Kelimeler listelenirken bir hata oluştu:', err.message);
        } else {
            rows.forEach((row) => {
                console.log('İngilizce: ' + row.english + ' | Türkçe: ' + row.turkish + ' | Doğru Sayısı: ' + row.true_count + ' | Yanlış Sayısı: ' + row.false_count + ' | Ezberlendi mi? ' + (row.memorized ? chalk.green('Evet') : chalk.red('Hayır')));
            });
        }
        programMain();
    });

}


async function programMain() {
    console.log('-----------------------------------');
    console.log(chalk.yellow('Kelime Ezberleme Uygulaması'));
    console.log(chalk.yellow('1. Kelime Ekle'));
    console.log(chalk.yellow('2. Kelime Ezberlemeye Başla'));
    console.log(chalk.yellow('3. Tüm Kelimeleri Listele'));
    rl.question('Seçenek: ', (option) => {
        switch (option) {
            case '1':
                console.log('Kelime ekleme seçildi.');
                addWord();

                break;
            case '2':
                console.log('Kelime ezberleme seçildi.');
                startMemorize();

                break;
            case '3':
                console.log('Tüm kelimeler listelenecek.');
                listAllWords();

                break;
            case 'exit':
                console.log('Çıkış yapılıyor.');
                rl.close();
                db.close();
                break;
            default:
                console.log('Geçersiz seçenek.');
                programMain();

                break;
        }
    });

}

function addWord() {
    console.log('-----------------------------------');
    rl.question('İngilizce kelimeyi girin: ', (englishWord) => {

        db.get('SELECT * FROM words WHERE english = ?', [englishWord], (err, row) => {
            if (err) {
                console.error('Kelime sorgulanırken bir hata oluştu:', err.message);
            } else {
                if (row) {
                    console.log(chalk.red('Bu kelime zaten ekli.'));
                    addWord();
                } else {
                    rl.question('Türkçe karşılığını girin: ', (turkishWord) => {
                        db.run('INSERT INTO words (english, turkish) VALUES (?, ?)', [englishWord, turkishWord], (err) => {
                            if (err) {
                                console.error('Kelime eklenirken bir hata oluştu:', err.message);
                            } else {
                                console.log(chalk.green('Kelime başarıyla eklendi.'));
                            }
                            addWord();
            
                        });
                    });
                }
            }
        });


    });
}

function startMemorize(){
    console.log('-----------------------------------');


    db.get('SELECT * FROM words WHERE memorized = 0 ORDER BY RANDOM() LIMIT 1', (err, row) => {
        if(err){
            console.error('Kelime seçilirken bir hata oluştu:', err.message);
        } else {
            if(row){
                console.log('İngilizce kelime: ' + row.english);
                rl.question('Türkçe karşılığını tahmin edin: ', (answer) => {
                    if(answer === row.turkish){
                        console.log(chalk.green('Tebrikler! Doğru bildiniz. ' + ' | Yandex Translate :  https://translate.yandex.com/?lang=en-tr&text=' + row.english));
                        db.run('UPDATE words SET true_count = true_count + 1 WHERE id = ?', [row.id], (err) => {
                            if(err){
                                console.error('Doğru bilindi olarak işaretlenirken bir hata oluştu:', err.message);
                            }
                            if(row.true_count >= 15){
                                db.run('UPDATE words SET memorized = 1 WHERE id = ?', [row.id], (err) => {
                                    if(err){
                                        console.error('Kelime ezberlendi olarak işaretlenirken bir hata oluştu:', err.message);
                                    }
                                });
                            }
                            startMemorize()
                        });
                    } else {
                        console.log(chalk.red('Maalesef yanlış bildiniz. Doğru cevap: ' + row.turkish + ' | Yandex Translate :  https://translate.yandex.com/?lang=en-tr&text=' + row.english));
                        db.run('UPDATE words SET false_count = false_count + 1 WHERE id = ?', [row.id], (err) => {
                            if(err){
                                console.error('Yanlış bilindi olarak işaretlenirken bir hata oluştu:', err.message);
                            }
                            startMemorize()
                        });
                    }
                });
            } else {
                console.log('Ezberlenecek kelime kalmadı.');
                programMain();
            }
        }
    });
}


programMain();