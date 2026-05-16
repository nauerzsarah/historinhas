import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const btnUpload = document.getElementById('btn-upload');
    const inputExcel = document.getElementById('input-excel');
    const statusDiv = document.getElementById('status');

    if (!btnUpload) return; // Segurança caso o script seja chamado na página errada

    btnUpload.onclick = async () => {
        const file = inputExcel.files[0];
        
        if (!file) {
            statusDiv.innerHTML = "<span style='color: red;'>Por favor, selecione um arquivo Excel primeiro!</span>";
            return;
        }

        statusDiv.innerHTML = "Processando arquivo...";
        btnUpload.disabled = true;

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                // Lê o arquivo usando a biblioteca SheetJS (importada no HTML)
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Pega a primeira aba do Excel
                const firstSheetName = workbook.SheetNames[0];
                const firstSheet = workbook.Sheets[firstSheetName];
                
                // Converte as linhas em uma lista de objetos do JavaScript
                const listaHistorias = XLSX.utils.sheet_to_json(firstSheet);

                if (listaHistorias.length === 0) {
                    statusDiv.innerHTML = "<span style='color: red;'>O arquivo Excel está vazio ou mal formatado.</span>";
                    btnUpload.disabled = false;
                    return;
                }

                statusDiv.innerHTML = `Enviando ${listaHistorias.length} histórias para o banco...`;

                let enviados comSucesso = 0;

                // Loop para cadastrar história por história no Firestore
                for (const historia of listaHistorias) {
                    // Verifica se a linha tem os cabeçalhos corretos (titulo e conteudo)
                    if (historia.titulo && historia.conteudo) {
                        await addDoc(collection(db, "historias"), {
                            titulo: historia.titulo,
                            conteudo: historia.conteudo,
                            dataCriacao: new Date() // Usado para ordenar as mais novas primeiro
                        });
                        enviadosComSucesso++;
                    }
                }

                statusDiv.innerHTML = `<span style='color: green;'>Sucesso! ${enviadosComSucesso} histórias enviadas para o Firebase.</span>`;
                inputExcel.value = ''; // Limpa o campo de arquivo

            } catch (error) {
                console.error("Erro no upload:", error);
                statusDiv.innerHTML = "<span style='color: red;'>Erro ao processar o arquivo. Verifique o console.</span>";
            } finally {
                btnUpload.disabled = false;
            }
        };

        // Dispara a leitura do arquivo como Array Buffer (essencial para planilhas)
        reader.readAsArrayBuffer(file);
    };
});
