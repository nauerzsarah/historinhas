import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Executa assim que a página terminar de carregar
document.addEventListener('DOMContentLoaded', () => {
    // Se o container da lista existir, estamos na Home (index.html)
    if (document.getElementById('lista-historias')) {
        inicializarHome();
    }
    
    // Se o container de leitura existir, estamos na Leitura (leitura.html)
    if (document.getElementById('texto-leitura')) {
        inicializarLeitura();
    }
});

/* ==========================================================================
   LÓGICA DA PÁGINA INICIAL (INDEX.HTML)
   ========================================================================== */
async function inicializarHome() {
    const listaContainer = document.getElementById('lista-historias');
    
    try {
        const q = query(collection(db, "historias"), orderBy("dataCriacao", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            listaContainer.innerHTML = '<p class="aviso">Nenhuma história encontrada. Vá ao Painel Admin para enviar um Excel!</p>';
            return;
        }

        listaContainer.innerHTML = ''; 

        querySnapshot.forEach((doc) => {
            const dados = doc.data();
            const id = doc.id;

            const card = document.createElement('div');
            card.className = 'card-historias';
            card.innerHTML = `
                <h3>${dados.titulo}</h3>
                <p>${dados.conteudo.substring(0, 100)}...</p>
                <a href="leitura.html?id=${id}" class="btn-ler">Ler Agora 📖</a>
            `;
            listaContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao buscar dados: ", error);
        listaContainer.innerHTML = '<p class="erro">Erro ao carregar histórias. Verifique as configurações do Firebase.</p>';
    }
}

/* ==========================================================================
   LÓGICA DA PÁGINA DE LEITURA (LEITURA.HTML)
   ========================================================================== */
async function inicializarLeitura() {
    const params = new URLSearchParams(window.location.search);
    const historiaId = params.get('id');

    if (!historiaId) {
        document.getElementById('texto-leitura').innerHTML = "<p class='erro'>História não encontrada.</p>";
        return;
    }

    try {
        const docRef = doc(db, "historias", historiaId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const dados = docSnap.data();
            document.getElementById('titulo-historia').innerText = dados.titulo;
            prepararTexto(dados.conteudo);
        } else {
            document.getElementById('texto-leitura').innerHTML = "<p class='erro'>História não encontrada no banco de dados.</p>";
        }
    } catch (error) {
        console.error("Erro ao carregar a história:", error);
    }
}

function prepararTexto(texto) {
    const container = document.getElementById('texto-leitura');
    // Divide o texto por espaços, quebras de linha ou tabulações
    const palavras = texto.split(/\s+/);
    
    // Monta o HTML com as palavras envelopadas em <span>
    container.innerHTML = palavras.map((p, i) => `<span class="palavra" id="p-${i}">${p}</span>`).join(' ');
    
    configurarAudio(texto, palavras);
}

function configurarAudio(texto, palavras) {
    const btn = document.getElementById('btn-ouvir');
    
    btn.onclick = () => {
        // Cancela qualquer leitura em andamento para não encavalar as vozes
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = parseFloat(document.getElementById('velocidade').value);

        btn.disabled = true;
        btn.innerText = "🔊 Lendo...";

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const caractereAtual = event.charIndex;
                let acumulador = 0;
                
                for (let i = 0; i < palavras.length; i++) {
                    // O acumulador reconstrói a posição dos caracteres para achar o Span correto
                    if (acumulador >= caractereAtual) {
                        const anterior = document.querySelector('.destaque');
                        if (anterior) anterior.classList.remove('destaque');

                        const elemento = document.getElementById(`p-${i}`);
                        if (elemento) {
                            elemento.classList.add('destaque');
                            // Move a tela suavemente acompanhando a leitura se o texto for longo
                            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        break;
                    }
                    acumulador += palavras[i].length + 1; 
                }
            }
        };

        utterance.onend = () => {
            const anterior = document.querySelector('.destaque');
            if (anterior) anterior.classList.remove('destaque');
            btn.disabled = false;
            btn.innerText = "▶ Ouvir História";
        };

        window.speechSynthesis.speak(utterance);
    };
}
