var valorDeCameraSalvo = localStorage.getItem("numeroCamera");
if(valorDeCameraSalvo != null){
localStorage.setItem("numeroCamera", 0);
valorDeCameraSalvo = localStorage.getItem("numeroCamera");
}

//escanea
var conteudoDoQrCode = "";
var numerocamera = parseInt(valorDeCameraSalvo);
const qrcodeScanner = document.getElementById('qrcode-scanner');
const qrcodeVideo = document.getElementById('qrcode-video');
const qrcodeResult = document.getElementById('qrcode-result');
const exame = document.getElementById('exame');
const retorno = document.getElementById('retorno');
const atendimento = document.getElementById('atendimento');
const atender = document.getElementById('atender');
const btrocarcamera = document.getElementById('trocarcamera');
const scanner = new Instascan.Scanner({ video: qrcodeVideo });


scanner.addListener('scan', function (content) {
    //QUANDO ESCANEAR ALGO
    qrcodeResult.textContent = `QR Code Escaneado: ${content}`;
    conteudoDoQrCode = (content).toString();
    console.log(`lido: ${conteudoDoQrCode}`)
    atendimento.style.display = 'block';
    retorno.style.display = 'block';
    exame.style.display = 'block';
    qrcodeScanner.style.display = 'none';
    btrocarcamera.style.display = 'none';
});

async function startScanner() {

    btrocarcamera.style.display = 'block';
    const devices = await Instascan.Camera.getCameras();
    

    if (devices.length === 0) {
        alert('Nenhuma câmera encontrada.');
        return;
    }

    const selectedDevice = devices[numerocamera]; // Seleciona a primeira câmera encontrada
    scanner.start(selectedDevice);
    qrcodeScanner.style.display = 'block';
    atender.style.display = 'none';
}

async function trocarcamera(){
    let devices = await Instascan.Camera.getCameras();
    let totalDeCameras = devices.length;
    if(numerocamera < totalDeCameras){
        numerocamera = numerocamera + 1;
    }
    if(numerocamera > totalDeCameras){
        numerocamera = 0;
    }
    // Salve o valor de numerocamera no localStorage
    localStorage.setItem("numeroCamera", numerocamera);

    // Inicialize a câmera
    startScanner();
}
///salva

function saveAtendimento(buttonName) {
    console.log(`conteudo que vamos salvar: ${conteudoDoQrCode}`)
    if(conteudoDoQrCode != "" && conteudoDoQrCode != null && conteudoDoQrCode != undefined){

        const qrCode = decodeURIComponent(conteudoDoQrCode);
        alert(`Conteúdo do QR Code: ${conteudoDoQrCode}\nBotão pressionado: ${buttonName}`);
        
        // Verifica se há conexão com a internet
        if (navigator.onLine) {
            salvarDadosNoFirebase(qrCode, buttonName);
        } else {
            // Armazena os dados localmente no IndexedDB para envio posterior
            const dadosLocal = {
                qrCode: qrCode,
                buttonName: buttonName
            };
            
            // Abre ou cria um banco de dados no IndexedDB
            const request = indexedDB.open('meuBancoDeDados', 1);
    
            request.onsuccess = function(event) {
                const db = event.target.result;
                
                // Cria uma transação para escrever os dados
                const transaction = db.transaction('dadosPendentes', 'readwrite');
                const objectStore = transaction.objectStore('dadosPendentes');
    
                // Adiciona os dados ao IndexedDB
                const addRequest = objectStore.add(dadosLocal);
                
                addRequest.onsuccess = function(event) {
                    alert('Os dados foram armazenados localmente e serão enviados quando a conexão estiver disponível.');
                };
            };
            
            request.onerror = function(event) {
                console.error('Erro ao abrir o banco de dados:', event.target.error);
            };
        }
    }else{
        alert(`conteudoDoQrCode == '${conteudoDoQrCode}'`)
    }
}

// Crie o banco de dados e o object store no início da sua aplicação
const request = indexedDB.open('meuBancoDeDados', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    const objectStore = db.createObjectStore('dadosPendentes', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('qrCode', 'qrCode', { unique: false });
    objectStore.createIndex('buttonName', 'buttonName', { unique: false });
};

// Verificar periodicamente a conexão e enviar dados pendentes
setInterval(function() {
    if (navigator.onLine) {
        const dbRequest = indexedDB.open('meuBancoDeDados', 1);

        dbRequest.onsuccess = function(event) {
            const db = event.target.result;
            
            const transaction = db.transaction('dadosPendentes', 'readonly');
            const objectStore = transaction.objectStore('dadosPendentes');
            const getDataRequest = objectStore.getAll();

            getDataRequest.onsuccess = function(event) {
                const dadosArray = event.target.result;
                if (dadosArray.length > 0) {
                    for (const dados of dadosArray) {
                        salvarDadosNoFirebase(dados.qrCode, dados.buttonName);
                    }

                    // Após o envio bem-sucedido, você pode excluir os dados pendentes
                    const deleteTransaction = db.transaction('dadosPendentes', 'readwrite');
                    const deleteObjectStore = deleteTransaction.objectStore('dadosPendentes');
                    deleteObjectStore.clear();
                }
            };
        };
    }
}, 5000); // Verificar a cada 5 segundos

async function salvarDadosNoFirebase(qrCodeContent, buttonName) {

    // Obtém a data/hora atual
var data = new Date();

// Guarda cada pedaço em uma variável
var dia     = data.getDate();           // 1-31
var dia_sem = data.getDay();            // 0-6 (zero=domingo)
var mes     = data.getMonth();          // 0-11 (zero=janeiro)
var ano2    = data.getYear();           // 2 dígitos
var ano4    = data.getFullYear();       // 4 dígitos
var hora    = data.getHours();          // 0-23
var min     = data.getMinutes();        // 0-59
var seg     = data.getSeconds();        // 0-59
var mseg    = data.getMilliseconds();   // 0-999
var tz      = data.getTimezoneOffset(); // em minutos

// Formata a data e a hora (note o mês + 1)
var hoje = dia + '/' + (mes+1) + '/' + ano4;
var str_hora = hora + ':' + min + ':' + seg;

var agora = " data: "+ hoje +" hora:"+str_hora

    qrCodeContent = btoa(qrCodeContent+agora);
    
    const urlDeCadastro = 'https://sistemadesenhas-f7261-default-rtdb.firebaseio.com/'+ buttonName + '/' + ano4 + '/' + mes + '/' + dia + '/' + hora + '/' + min + '/' + seg + '/' + mseg + '.json?';

    // Criar um objeto com os dados do QR Code e do botão
    const dadosCadastro = {
        qrCodeContent: qrCodeContent,
        buttonName: buttonName
    };

    // Configurar as opções para a requisição PUT
    const requestOptions = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosCadastro)
    };

    try {
        // Enviar a requisição PUT
        const response = await fetch(urlDeCadastro, requestOptions);

        if (response.ok) {
            console.log('Cadastro realizado com sucesso!');
        } else {
            console.error('Erro ao cadastrar QR Code e botão:', response.statusText);
        }
    } catch (error) {
        console.error('Erro ao enviar a requisição:', error);
    }
}


function goToHomePage() {
    window.location.href = "/";
}



function getParameterByName(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
