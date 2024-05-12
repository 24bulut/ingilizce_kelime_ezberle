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


function programMain() {
    console.log('-----------------------------------');
    console.log(chalk.yellow('Kelime Ezberleme Uygulaması'));
    console.log(chalk.yellow('1. Kelime Ekle'));
    console.log(chalk.yellow('2. Kelime Ezberlemeye Başla'));
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
            default:
                console.log('Geçersiz seçenek.');
                programMain();

                break;
        }
    });

}

function addWord() {
    rl.question('İngilizce kelimeyi girin: ', (englishWord) => {
        rl.question('Türkçe karşılığını girin: ', (turkishWord) => {
            db.run('INSERT INTO words (english, turkish) VALUES (?, ?)', [englishWord, turkishWord], (err) => {
                if (err) {
                    console.error('Kelime eklenirken bir hata oluştu:', err.message);
                } else {
                    console.log('Kelime başarıyla eklendi.');
                }
                addWord();

            });
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
                            if(row.true_count >= 5){
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