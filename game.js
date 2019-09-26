/**
 *@description Espaço para constantes e variaveis globais
*/

//objeto com contendo propriedades globais
var objGlobal = {
    valorMin: 0,
    valorMax: 0,
    qtdeApostas: 0,
    qtdeAcertos: 0,
    qtdeErros: 0,
    numerosApagadosReset: [],
    resetAtivo: 0,
    sorteioAtivo: 0,
    maxApostas: 15,
    maisGerados: [],
    contagemMaisGerados: []
}

var intervaloResete
var pausaHankeamento = 0
var contadorLinha = 0

/**
 *@description Função de chamada geral no momento da leitura do arquivo 
*/

$(function(){
    
    $('#cp-valor-min').change(function(){
        var numero = numeroValido( $(this).val() )
        objGlobal.valorMin = (numero == true) ? $(this).val() : 0
    })

    $('#cp-valor-max').change(function(){
        var numero = numeroValido( $(this).val() )
        objGlobal.valorMax = (numero == true) ? $(this).val() : 0
    })

    $('#cp-qtde-apostas').change(function(){
        var qtde = $(this).val()
        var numero = numeroValido(qtde)

        objGlobal.qtdeApostas = (numero == true) ? qtde : 0

        if( parseInt(objGlobal.qtdeApostas) > parseInt(objGlobal.maxApostas) ){
            objGlobal.qtdeApostas = objGlobal.maxApostas
            alert(`O número maximo de chances (apostas) por sorteio é ${objGlobal.maxApostas}`)
        }

        setTimeout(
            montaTabelaResultados( objGlobal.qtdeApostas ), 250
        )
    })

    $('#cp-aposta').change(function(){
        if( objGlobal.valorMin != 0 && objGlobal.valorMax != 0 && objGlobal.qtdeApostas != 0 ){
            adicionaApostas() 
        }else{
            alert('Primeiro deve especificar o valor mínimo e valor máximo e quantas a quantidade de chances por sorteio')
            $('#cp-valor-min').focus()
        }
    })
    
    $('#bt-sortear').click(function(){
        if(objGlobal.resetAtivo == 0){
            objGlobal.sorteioAtivo = 1
            objGlobal.resetAtivo = 0

            gerenciaSorteio()
        }else{
            alert('O reset está em execução, precisa terminar antes de sortear')
        }
    })

    $('#bt-pausa').click(function(){
        pausaHankeamento = 1
    })

    $('#bt-auto').click(function(){
        if(objGlobal.resetAtivo == 0){
            pausaHankeamento = 0
            objGlobal.sorteioAtivo = 1
            objGlobal.resetAtivo = 0

            gerenciaSorteio(true)
        }else{
            alert('O reset está em execução, precisa terminar antes de sortear')
        }
    })

    $('#bt-manopla').click(function(){
        if(objGlobal.sorteioAtivo == 0){
            objGlobal.resetAtivo = 1
            objGlobal.sorteioAtivo = 0

            gerenciaReset()
        }else{
            alert('Não é possível desfazer agora... Está acontencendo um sorteio!!!')
        }
    })

    $('#bt-reset').click(function(){
        window.location.href = ''
    })

    $('#sct-tipo').change(function(){
        try{
            
            var max = 0
            var chances = 0

            if( $(this).val() != "" ){
                if( objGlobal.sorteioAtivo == 0 && objGlobal.resetAtivo == 0 ){
                    
                    resetGeral()

                    if( $(this).val() == "1" ){
                        max = 60
                        chances = 6
                    }else{
                        max = 25
                        chances = 15
                    }

                    $('#cp-valor-min').val("1").trigger('change')
                    $('#cp-valor-max').val(max).trigger('change')
                    $('#cp-qtde-apostas').val(chances).trigger('change')

                    setTimeout(function(){
                        $('#cp-aposta').focus()
                    }, 500)
                    

                }else{
                    alert('Não é possível modificar o tipo, um sorteio ou reset pode estar ocorrendo, por favor tente mais tarde...')
                }
            }
        }catch(e){
            console.log(e)
        }
    })

    $('#cp-valor-min').focus()
})

/**
 * @description Adiciona os números a lista de números apostados, na tabela html de resultados
 * @author Fernando Bino Machado
*/
function adicionaApostas(){
    var aposta = $('#cp-aposta').val()
    var mensagem = null

    //válida numero apostado
    if( 
        aposta != null && 
        aposta != undefined && 
        numeroValido(aposta) && 
        parseInt(aposta) <= parseInt(objGlobal.valorMax) && 
        parseInt(aposta) >= parseInt(objGlobal.valorMin)
    ){

        var htmlNumerosApostados = $('.td-apostas')

        var listaNumeros = extraiNumeros(htmlNumerosApostados)

        if( existemZerados(htmlNumerosApostados) ){

            if( parseInt(aposta) < 10 ){
                aposta = `0${aposta}`
            }

            if( listaNumeros.indexOf(aposta) == -1 ){

                var achouPosicaoZerada = false

                for(var i=0;i<listaNumeros.length;i++){
                    if( !achouPosicaoZerada ){
                        if( listaNumeros[i] == "00" ){
                            listaNumeros[i] = aposta
                            achouPosicaoZerada = true
                        }
                    }
                }
                
                var listaOrdenada = ordenaNumeros(listaNumeros)
                
                escreveNumerosNaTabela(listaOrdenada)
                
                setTimeout(function(){
                    $('#cp-aposta').val('').focus()
                }, 250)

            }else{
                mensagem = 'O número já foi apostado!!'
            }
        }else{
            mensagem = 'Limite de números atingido!!'
        }

    }else{
        mensagem = 'Número para apósta é inválido!!'
    }

    if( mensagem != null ){
        alert(mensagem)
        $('#cp-aposta').val('').focus()
    }
    
}

/**
 * @description Recebe as tds referentes às apostas e as usa para montar um array com os números já apostados
 * @author Fernando Bino Machado
 * @param celulas = celulas "tds" da tabela html contendo os números já apóstados
 * @returns listaNumeros array
*/

function extraiNumeros(celulas = []){
    var listaNumeros = []

    try{
        if( celulas.length > 0 ){
            for( const cel of celulas ){
                let num = $(cel).text()
                listaNumeros.push(num)
            }
        }
    }catch(e){
        console.error(e)
    }

    return listaNumeros
}

/**
 * @description Recebe uma string de caracteres, tenta fazer uma operação matemática, e então valida se é numero ou não
 * @author Fernando Bino Machado
 * @param strNumero cadeia de caracteres a ser verificada
 * @returns numero booleano true ou false
*/

function numeroValido(strNumero = null){
    var numero = false

    try{
        if( strNumero != null && strNumero != undefined ){
            var testeMatematico = strNumero * 1

            if( !isNaN(testeMatematico) ){
                numero = true
            }
        }
    }catch(e){
        console.error(e)
    }

    return numero
}

/**
 * @description recebe e ordena lista de numeros qualquer
 * @author Fernando Bino Machado
 * @param listaNumeros array
 * @returns listaOrdenada array
*/

function ordenaNumeros(listaNumeros = []){
    listaOrdenada = listaNumeros
    
    try{
        for(var i=0;i<listaNumeros.length;i++){

            for(var j=i+1;j<listaOrdenada.length;j++){

                if( parseInt(listaOrdenada[i]) > parseInt(listaOrdenada[j]) ){
                    var maior = listaOrdenada[i]
                    var menor = listaOrdenada[j]
                    listaOrdenada[i] = menor
                    listaOrdenada[j] = maior
                }

            }

        }
    }catch(e){
        console.error(e)
    }

    return listaOrdenada
}

/**
 * @description ordena objetos
 * @author Fernando Bino Machado
 * @param listaNumeros array
 * @returns listaOrdenada array
*/

function ordenaNumerosObj(listaNumeros = []){
    var listaOrdenadaObj = listaNumeros
    
    try{
        for(var i=0;i<listaNumeros.length;i++){

            for(var j=i+1;j<listaOrdenadaObj.length;j++){

                if( parseInt(listaOrdenadaObj[i].qtde) > parseInt(listaOrdenadaObj[j].qtde) ){
                    var maior = listaOrdenadaObj[i]
                    var menor = listaOrdenadaObj[j]
                    listaOrdenadaObj[i] = menor
                    listaOrdenadaObj[j] = maior
                }

            }

        }
    }catch(e){
        console.error(e)
    }

    return listaOrdenadaObj
}

/**
 * @description recebe a lista de numeros e joga na tabela html
 * @author Fernando Bino Machado
 * @param listaNumeros array
*/

function escreveNumerosNaTabela(listaNumeros = []){
    try{
        if(listaNumeros.length > 0){
            listaNumeros.forEach(function(valor,indice){
                var num = parseInt(valor)

                if( num < 10 ){
                    num = `0${num}`
                }
                
                let id = indice + 1
                $(`#a${id}`).text(num)
            })
        }
    }catch(e){
        console.error(e)
    }
}

/**
 * @description recebe o html dos numeros apostados e verifica se dentre eles existe algum zerado
 * @author Fernando Bino Machado
 * @param celulas array
 * @returns zerado booleano true ou false
*/

function existemZerados(celulas = []){
    zerados = false

    try{
        for( const cel of celulas ){
            if(zerados == false){
                if( $(cel).text() == "00"){
                    zerados = true
                }
            }
        }
    }catch(e){
        console.error(e)
    }

    return zerados
}

/**
 * @description Gerencia o sorteio dos numeros
 * @author Fernando Bino Machado
*/

function gerenciaSorteio(automatico = false){
    try{
        objGlobal.qtdeAcertos = 0
        objGlobal.qtdeErros = 0
        
        var htmlNumerosApostados = $('.td-apostas')

        var listaNumerosApostados = extraiNumeros(htmlNumerosApostados)

        if( !existemZerados(htmlNumerosApostados) && htmlNumerosApostados.length > 0 ){

            $('.td-sorteadas').text('00')

            var listaNumeros = gerarNumeros()
            
            escreveSorteio(1, listaNumeros, listaNumerosApostados, automatico)
        }else{
            alert('Não é possível iniciar o sorteio, informe suas apostas antes... Ou se algo deu errado clique em Reset Rapido')
            $('#cp-aposta').fadeIn(1500)
            $('#cp-aposta').focus()
        }

    }catch(e){
        console.error(e)
    }
}

/**
 * @description Gera os numeros para sorteio
 * @author Fernando Bino Machado
 * @returns listaOrdenada array
*/

function gerarNumeros(){
    var listaNumeros = []
    var listaOrdenada = []
    var historico = []
    var obtemMaxGlogal = parseInt(objGlobal.valorMax)
    var obtemMinGlogal = parseInt(objGlobal.valorMin)
    var obtemQtdeApostasGlobal = parseInt(objGlobal.qtdeApostas)

    try{
        for(var i=0;i<obtemQtdeApostasGlobal;i++){
            var numValido = false

            var num = parseInt( Math.random(obtemMaxGlogal) * 100 )

            while( !numValido ){
                num = parseInt( Math.random(obtemMaxGlogal) * 100 )

                if( num >= obtemMinGlogal && num <= obtemMaxGlogal && historico.indexOf(num) == -1 ){
                    historico.push(num)
                    numValido = true
                }
            }

            listaNumeros.push(num)
        }

        listaOrdenada = ordenaNumeros(listaNumeros)

        listaOrdenada.forEach(function(valor, indice){
            objGlobal.maisGerados.push(valor)
        })
        
    }catch(e){
        listaOrdenada = []
        console.error(e)
    }
    
    return listaOrdenada
}

/**
 * @description Usando função recursiva para escrever os numeros sorteados na tabela html
 * @author Fernando Bino Machado
 * @param contador variavel de controle caso seja igual a 6  a chamada a recursividade se encerra
 * @param listaNumeros lista de numeros que foram gerados e que devem ser escritos na tabela html
*/

function escreveSorteio(contador, listaNumeros, listaNumerosApostados, automatico = false){
    
    var obtemQtdeApostasGlobal = parseInt(objGlobal.qtdeApostas)

    //limpa e marca as posições
    for(var i = 1; i<=obtemQtdeApostasGlobal; i++){
        $(`#hd${i}`).css('backgroundColor','#ffffff')
    }

    $(`#hd${contador}`).css('backgroundColor','burlywood')

    let indice = contador - 1
    
    var num = listaNumeros[indice]
    var strNum = listaNumeros[indice]

    if( parseInt(num) < 10 ){
        num = `0${listaNumeros[indice]}`
    }

    $(`#s${contador}`).text(num)
    
    if( listaNumerosApostados.indexOf( $(`#s${contador}`).text() ) != -1 ){
        objGlobal.qtdeAcertos += 1
        $(`#s${contador}`).attr('class','td-sorteadas manopla acertou')
    }else{
        objGlobal.qtdeErros += 1
        $(`#s${contador}`).attr('class','td-sorteadas manopla errou')
    }

    $(`#s${contador}`).show('slow')

    gerarGrafico('pie')

    setTimeout(function(){
        
        if( contador < obtemQtdeApostasGlobal ){
            contador += 1
            escreveSorteio(contador, listaNumeros, listaNumerosApostados,automatico)
        }

    }, 2000)

    if(contador == obtemQtdeApostasGlobal){
        objGlobal.sorteioAtivo = 0
        
        if(automatico){
            setTimeout(function(){
                objGlobal.contagemMaisGerados = ordenaMaisGerados()
                
                escreveNumerosMaisSorteados()
                
                if( pausaHankeamento == 0 ){
                    $('#bt-auto').trigger('click')
                }
            }, 3000)
        }
    }
}

/**
 * @description Escreve o hanking dos numeros mais sorteados na tabela
 * @author Fernando Bino Machado
*/

function escreveNumerosMaisSorteados(){
    
    try{
        $('#tbody-hanking').html("")

        var obtemChances = parseInt(objGlobal.qtdeApostas)
        var numeros = []
        var cont = 1

        for( var i = objGlobal.contagemMaisGerados.length - 1; i > 0; i-- ){
            
            if( cont <= obtemChances ){
                var htmlContagem = `
                    <tr>
                        <td>${cont}º</td>
                        <td>${objGlobal.contagemMaisGerados[i].numero}</td>
                        <td>${objGlobal.contagemMaisGerados[i].qtde}</td>
                    </tr>
                `
                
                numeros.push(objGlobal.contagemMaisGerados[i].numero)

                $('#tbody-hanking').append(htmlContagem)
            }

            cont += 1

            var numerosFinais = ordenaNumeros(numeros)
            $('#numerosFinais').text('Números Sugeridos: ' + numerosFinais.toLocaleString())
        }
    }catch(e){
        objGlobal.contagemMaisGerados[1]
        console.error(e)
    }
}

/**
 * @description Monta a tabela para base de resultados
 * @author Fernando Bino Machado
 * @param qtde quantidade de chances por sorteio, que define quantas tds cada row da tabela terá
*/

function montaTabelaResultados(qtde = 0){
    
    try{
        if( parseInt(qtde) > 0 ){
            var qtdeColSpan = parseInt(qtde) + 1

            $('#tr-posicoes').html('')
            $('#tr-apostados').html('')
            $('#tr-sorteados').html('')

            //define novo colspan para o cabeçario resultados
            $('#td-head').attr('colspan',qtdeColSpan)

            //define html para as trs posições, apostas e sorteio
            var htmlTrPosicoes = ``
            var htmlTrApostados = ``
            var htmlTrSorteados = ``

            for(var i=1;i<=qtde;i++){
                if(i == 1){
                    htmlTrPosicoes = `${htmlTrPosicoes} <td class="manopla"></td>`
                    htmlTrPosicoes = `${htmlTrPosicoes} <td id="hd${i}"  class="manopla">${i}º</td>`

                    htmlTrApostados = `${htmlTrApostados} <td  class="manopla">Apostados</td>`
                    htmlTrApostados = `${htmlTrApostados} <td id="a${i}" class="td-apostas manopla">00</td>`

                    htmlTrSorteados = `${htmlTrSorteados} <td class="manopla">Sorteados</td>`
                    htmlTrSorteados = `${htmlTrSorteados} <td id="s${i}" class="td-sorteadas manopla">00</td>`
                }else{
                    htmlTrPosicoes = `${htmlTrPosicoes} <td id="hd${i}" class="manopla">${i}º</td>`
                    htmlTrApostados = `${htmlTrApostados} <td id="a${i}" class="td-apostas manopla">00</td>`
                    htmlTrSorteados = `${htmlTrSorteados} <td id="s${i}" class="td-sorteadas manopla">00</td>`
                }
            }

            $('#tr-posicoes').html(htmlTrPosicoes)
            $('#tr-apostados').html(htmlTrApostados)
            $('#tr-sorteados').html(htmlTrSorteados)
        }
    }catch(e){
        console.error(e)
    }
}

/**
 * @description gerencia algoritimo de reset
 * @author Fernando Bino Machado
*/
function gerenciaReset(){
    try{
        $('#container-grafico').hide(2500)
        
        $('#tbody-hanking').html("")

        objGlobal.numerosApagadosReset = []

        executaResetNumeros(1)
    }catch(e){
        console.log(e)
    }
}

/**
 * @description usa recursividade para fazer sumir as celulas
 * @author Fernando Bino Machado
 * @param contador define a parada de uso recursivo
*/

function executaResetNumeros(contador){
    objGlobal.numerosApagadosReset.push(contador)

    var obtemQtdeApostasGlobal = (parseInt(objGlobal.qtdeApostas) * 3) + 3
    
    console.log(
        {
            "Total-Campos":obtemQtdeApostasGlobal,
            "Apagados-Pela-Manopla-do-Thanos":objGlobal.numerosApagadosReset.length
        }
    )

    $(`.manopla:eq(${contador})`).css('backgroundColor','red')
    $(`.manopla:eq(${contador})`).hide(2500)
    
    intervaloResete = setTimeout(function(){
        
        if( contador <= obtemQtdeApostasGlobal ){
            
            var numValido = false
            
            contador = parseInt( Math.random(20) * 100 )

            while(!numValido){
                contador = parseInt( Math.random(20) * 100 )

                if( objGlobal.numerosApagadosReset.indexOf(contador) == -1 && contador <= obtemQtdeApostasGlobal && contador > 0 ){
                    numValido = true
                }
            }
            
            executaResetNumeros(contador)
        
        }
    }, 3000)

    if( objGlobal.numerosApagadosReset.length == obtemQtdeApostasGlobal ){
        clearTimeout(intervaloResete)
        
        setTimeout(function(){
            window.location.href = ''
        }, 2000)
        
    }
}

/**
 * @description Gera o grafico de barras horizontais para acompanhamento de acertos e erros
 * @author Fernando Bino Machado
 * @param tipo tipo pode ser pie bar etc ... é o tipo do grafico
*/

function gerarGrafico(tipo){
    try{
        $('#graf').remove()
        $('#container-grafico').html('<canvas id="graf"></canvas>')

        var contexto = document.getElementById('graf').getContext('2d')

        new Chart(
            contexto,
            {
                type: tipo,
                data:{
                    labels:[`Acertos:${objGlobal.qtdeAcertos}`,`Erros: ${objGlobal.qtdeErros}`],
                    datasets: [
                        {
                            label:'Pontuação',
                            data:[objGlobal.qtdeAcertos,objGlobal.qtdeErros], 
                            backgroundColor: ['green','orange']
                        }
                    ]
                },
                options:{
                    title: {
                        display: true,
                        text: 'Resultado da Simulação',
                        fontSize: 20
                    },
                    animation: false,
                    legend:{
                        position: "right"
                    }
                }
            }
        )
    }catch(e){
        console.error(e)
    }
}

/**
 * @description Monta um array com base no historico de sorteio, conta as ocorrencias e ordena o array
 * @author Fernando Bino Machado
*/

function ordenaMaisGerados(){
    try{
        var maisGerados = []
        maisGerados.push(0)

        var obtemMaxGlogal = parseInt(objGlobal.valorMax)
        
        for(var i = 1; i<obtemMaxGlogal; i++){
            var ocorrencias = 0

            objGlobal.maisGerados.forEach(function(valor, indice){
                if( valor == i ){
                    ocorrencias += 1
                }
            })

            maisGerados.push({numero: i, qtde: ocorrencias})
        }
        
        var listaOrdenadaObj = ordenaNumerosObj(maisGerados)

        return listaOrdenadaObj

    }catch(e){
        console.error(e)
        return []
    }
}

/**
 * @description Faz o reset geral
 * @author Fernando Bino Machado
*/
function resetGeral(){
    try{
        //limpa o intervalo de tempo que está ocorrendo
        clearTimeout(intervaloResete)

        //limpar o grafico
        $('#graf').remove()
        $('#container-grafico').html('<canvas id="graf"></canvas>')

        //limpa o historico de sorteios
        objGlobal.maisGerados = []

    }catch(e){
        console.error(e)
    }
}