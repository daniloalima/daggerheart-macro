async function manage_dice(){
    const hope_die = await new Roll("1d12[astralsea]").roll({async:true});
    const fear_die = await new Roll("1d12[bloodmoon]").roll({async:true});
    const adv_die = await new Roll("1d6[bronze]").roll({async:true})
    
    const result = [hope_die,fear_die,adv_die]
    
    return result
}

async function send_message(dice_results, mods, adv = 0) {
    const sum = dice_results[0].total + dice_results[1].total;
    const hope = dice_results[0].total > dice_results[1].total ? true : false;
    let details;
    
    const fear_hope_result = hope ? `<strong style=color:#a673e6>ESPERANÇA</strong>` : `<strong style=color:#5c2931>MEDO</strong>`;
    
    await game.dice3d.showForRoll(dice_results[0]);
    await game.dice3d.showForRoll(dice_results[1]);

    if (adv > 0 || adv < 0) {
        details = `${dice_results[0].total}(esperança) + ${dice_results[1].total}(medo) + ${mods}(mods) + ${adv}(van/des)`;
        await game.dice3d.showForRoll(dice_results[2]);
    }
    else {
        details = `${dice_results[0].total}(esperança) + ${dice_results[1].total}(medo) + ${mods}(mods)`;
    }
    
    const content = `
    <h3 style="font-family:arial;color:#a673e6;font-size:20px;font-weight:bold">
    Esperança </h3>
    <p style="font-family:arial;color:black;font-size:15px;font-weight:bold">
    ${dice_results[0].total} </p> </br>

    <h3 style="font-family:arial;color:#5c2931;font-size:20px;font-weight:bold">
    Medo </h3>
    <p style="font-family:arial;color:black;font-size:15px;font-weight:bold">
    ${dice_results[1].total} </p> </br>
    
    <h3 style="font-family:arial;color:black;font-size:20px;font-weight:bold">
    Resultado </h3>
    <p style="font-family:arial;color:black;font-size:15px;font-weight:bold">
    ${sum + mods + adv} com ${fear_hope_result}</p>
    <p style="font-family:arial;color:black;font-size:10px">
    ${details}</p>
    `;
    
    ChatMessage.create({content: content})
}

async function main() {
    let dice_results = await manage_dice();
    let mods;
    
    let d = new Dialog({
        title: "Dados de Dualidade",
        content: `
        <form class="flexcol">
            <div class="form-group">
                <label for="mods">Modificador</label>
                <input type="text" name="mods" placeholder="Ex: +1, -1">
            </div>
            <div class="form-group">
                <label for="adv_select">Vantagem?</label>
                <select name="adv_select">
                    <option value="nenhum">Nenhum</option>
                    <option value="vantagem">Vantagem</option>
                    <option value="desvantagem">Desvantagem</option>
                </select>
            </div>
        </form>
        `,
        buttons: {
            yes: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Ok!',
                callback: (html) => {
                    const input = html.find('[name="mods"]').val();
                    const select = html.find('[name="adv_select"]').val();
                    const mods = parseInt(input);
                    let adv = dice_results[2].total;
                    if ("nenhum" == select) {
                        send_message(dice_results, mods)
                    }
                    else if ("vantagem" == select) {
                        send_message(dice_results, mods, adv)
                    }
                    else {
                        send_message(dice_results, mods, -adv)
                    }
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
