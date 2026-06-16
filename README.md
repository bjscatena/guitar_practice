# Guitar Practice - Estúdio de Treino de Guitarra Inteligente

O **Guitar Practice** é um aplicativo web interativo projetado especificamente para guitarristas praticarem riffs, solos, seções difíceis ou músicas completas de forma eficiente. Com ele, você pode isolar qualquer parte de uma música, ajustar a velocidade de reprodução para treinar devagar e acelerar gradualmente, e automatizar repetições.

## 🚀 Funcionalidades Principais

- 🎸 **Músicas Fixas**: Pratique com backing tracks disponíveis diretamente na pasta `tracks` do aplicativo.
- ⏱️ **Loop Preciso com Waveform**: Selecione o trecho exato de treino arrastando a região colorida diretamente sobre o gráfico da onda sonora (Wavesurfer.js), ou insira os tempos manualmente com precisão de décimos de segundo.
- ⚡ **Aceleração/Desaceleração Progressiva**: Mude a velocidade da música de 50% a 150% do tempo original. Você pode ajustar a velocidade no meio do treino com os botões de ajuste fino (-5% / +5%).
- 🔄 **Rotina de Loops Configurada**: Defina a quantidade de repetições (ex: 10 voltas) ou configure para loop infinito. O aplicativo controla o progresso com um círculo visual e para automaticamente ao terminar.
- ⏳ **Tempo de Preparação (Countdown)**: Configure uma contagem regressiva (3s, 5s ou 10s) com aviso sonoro (bipe) antes do treino iniciar para dar tempo de posicionar suas mãos na escala da guitarra.
- ⏸️ **Pausa entre Loops**: Defina um tempo de descanso (0s a 10s) a cada ciclo para reajustar sua postura ou descansar a palheta.
- 📝 **Anotações e Cifras Autosalvas**: Bloco de notas integrado para colar acordes, tablaturas ou detalhes do treino. O texto é salvo automaticamente no seu navegador por música.
- 🏆 **Histórico de Prática**: Acompanhe as sessões que você concluiu hoje diretamente na barra lateral.

---

## 🛠️ Como Executar Localmente

Como o RiffLoop é feito com HTML5, CSS3 e Javascript puro, você só precisa de um servidor local para que o Wavesurfer.js carregue os arquivos de áudio corretamente sem restrições de CORS do navegador.

### Opção 1: Usando Python (Recomendado)
Abra o terminal na pasta do projeto e execute:
```bash
python -m http.server 8000
```
Depois, abra no seu navegador: `http://localhost:8000`

### Opção 2: Usando Node.js / NPM
Abra o terminal na pasta do projeto e execute:
```bash
npx http-server -p 8000
```
Depois, abra no seu navegador: `http://localhost:8000`

---

## 🌐 Como Publicar no GitHub Pages

Para colocar o site online de graça no GitHub Pages, siga estes passos simples:

1. **Crie um repositório no GitHub**:
   - Vá em [github.com/new](https://github.com/new).
   - Nomeie o repositório como `guitar-practice` ou o nome de sua preferência.
   - Deixe o repositório como **Público**.

2. **Suba os arquivos do seu computador**:
   - Inicialize o Git na pasta local do projeto:
     ```bash
     git init
     git add .
     git commit -m "Initial commit - Guitar Practice app"
     ```
   - Vincule e envie os arquivos para o repositório criado (siga os comandos sugeridos pelo próprio GitHub, ex):
     ```bash
     git branch -M main
     git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
     git push -u origin main
     ```

3. **Ative o GitHub Pages**:
   - No GitHub, acesse a aba **Settings** (Configurações) do seu repositório.
   - Na barra lateral esquerda, clique em **Pages**.
   - Na seção "Build and deployment", sob **Branch**, mude de `None` para `main` (ou a branch que subiu, geralmente `/root`) e clique em **Save**.
   - Aguarde cerca de 1 a 2 minutos. O GitHub gerará um link público para o seu site (ex: `https://seu-usuario.github.io/nome-do-repositorio/`).

Pronto! Agora você poderá treinar guitarra abrindo seu link do GitHub Pages de qualquer dispositivo.

---

## 🎹 Atalhos de Teclado Úteis

- <kbd>Espaço</kbd> : Pausar / Iniciar a música.
- <kbd>Esc</kbd> : Cancelar a rotina de treino ativa.
- <kbd>S</kbd> : Define a posição atual como o **Início** do loop.
- <kbd>E</kbd> : Define a posição atual como o **Fim** do loop.

*Aproveite os treinos e bons solos!* 🎸🔥
