async function roll_d10_bundle(pool, explosao) {
    const rolls = [];
    let rolling = true;
    console.log(`Rolando ${pool}d10 com explosão em ${explosao}`);

    while (rolling) {
        const formula = `${pool}d10[bloodmoon]`;
        const roll = new Roll(formula);
        await roll.evaluate({ async: true });
        await game.dice3d.showForRoll(roll, game.user, true);

        const results = roll.dice[0].results.map(r => r.result);
        rolls.push(...results);

        const explodingCount = results.filter(r => r >= explosao).length;

        if (explodingCount > 0) {
            console.log(`Explosão! Rolando novamente ${explodingCount} dados.`);
            pool = explodingCount;
        } else {
            rolling = false;
        }
    }

    return rolls;
}

async function send_message(rolls, flat, resultado) {
    const sortedRolls = rolls.sort((a, b) => b - a);


    const content = `
    </br>
    <h3 style="font-family:arial;color:white;font-size:20px;font-weight:bold">
    Dados Rolados </h3>
    <p style="font-family:arial;color:white;font-size:12px">
    ${sortedRolls} </p> </br>

    <h3 style="font-family:arial;color:#white;font-size:20px;font-weight:bold">
    Bônus Flat </h3>
    <p style="font-family:arial;color:white;font-size:12px">
    ${flat} </p> </br>

    <h3 style="font-family:arial;color:white;font-size:20px;font-weight:bold">
    Resultado </h3>
    <p style="font-family:arial;color:white;font-size:12px">
    ${resultado}</p>
    `;

    ChatMessage.create({content: content})
}

async function main() {
    let d = new Dialog({
        title: "Rolagem de dados",
        content: `
        <form class="flexcol">
            <div class="form-group">
                <label for="pool">Quantidade de dados</label>
                <input type="text" name="pool" placeholder="Mínimo 1">
            </div>
            <div class="form-group">
                <label for="flat">Bônus flat</label>
                <input type="text" name="flat" placeholder="Apenas números inteiros">
            </div>
            <div class="form-group">
                <label for="explosao">Explosão</label>
                <input type="text" name="explosao" placeholder="Valor para explosao de dados">
            </div>
            <div class="form-group">
                <label for="target">Alvo para sucesso</label>
                <input type="text" name="target" placeholder="Rolagens iguais ou acima disso são sucesso">
            </div>
            <div class="form-group">
                <label for="dificuldade">Dificuldade</label>
                <input type="text" name="dificuldade" placeholder="Dificuldade do teste/Blindagem inimiga">
            </div>
        </form>
        `,
        buttons: {
            yes: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Ok!',
                callback: async (html) => {
                    const pool_input = html.find('[name="pool"]').val();
                    const flat_input = html.find('[name="flat"]').val();
                    const explosao_input = html.find('[name="explosao"]').val();
                    const target_input = html.find('[name="target"]').val();
                    const dificuldade_input = html.find('[name="dificuldade"]').val();

                    let pool = parseInt(pool_input);
                    let flat = parseInt(flat_input);
                    let explosao = parseInt(explosao_input);
                    let target = parseInt(target_input);
                    let dificuldade = parseInt(dificuldade_input);

                    if (isNaN(pool) || pool < 1) {
                        pool = 1;
                    }

                    if (isNaN(flat)) {
                        flat = 0;
                    }

                    if (isNaN(explosao)) {
                        explosao = 10;
                    }
                    else if (explosao < 9) {
                        ui.notifications.error("O valor de explosão deve ser maior ou igual a 9.");
                        return;
                    }

                    if (isNaN(target)) {
                        target = 8;
                    }

                    dificuldade = isNaN(dificuldade) ? 0 : dificuldade;

                    const final_pool = pool - dificuldade;

                    const rolls = await roll_d10_bundle(final_pool, explosao);
                    const sucessos = rolls.filter(r => r >= target).length;
                    const falhaCritica = sucessos === 0 && rolls.includes(1) ? true : false;
                    const total = sucessos + flat;

                    const resultado = falhaCritica
                        ? "Falha Crítica!"
                        : sucessos > 0
                        ? `${sucessos} sucessos + ${flat} flat = ${total}.`
                        : "Nenhum sucesso.";

                    console.log(resultado);

                    await send_message(rolls, flat, resultado);
                },
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: 'Cancelar'
            },
        },
        default: "yes",
        close: async () => {
            console.log("dialog closed")
        },
    }).render(true)
}

main()
