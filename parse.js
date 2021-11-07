let debug = false;
let libreriaCanti = null;

const contentHeader = ``;

// Per rispettare la licenza, se modifichi il footer predefinito è necessario
// trovare un altro modo di rispettare il criterio di attribuzione.
const contentFooter = `

--------------------------------------------------------------------------------

Vuoi realizzare una pagina simile a questa? {github}.
`;

function alertAndLog(err) {
    console.log(err);
    /*if (debug) {
        alert(err);
    }*/
}

function parseSource(text) {
    let links = [];
    text = text.replace(/^@.*?\n/gm, "");
    text = text.replace(/\{[ \t]*(.*?)[ \t]*\}/gm, function(match, p1) {
        let p1l = p1.toLowerCase();
        if (p1l in libreriaCanti) {
            return libreriaCanti[p1l];
        }
        if (" indice croce risposta musica github ".indexOf(" "+p1l+" ") >= 0) {
            return match;
        }
        if (p1l.startsWith("media ")) {
            return match;
        }
        if (p1l.startsWith("img ")) {
            return match;
        }
        alertAndLog("Impossibile trovare \"" + p1 + "\" nella libreria.");
        return "%" + match;
    });
    // lo faccio due volte per gestire i tag media nella libreria
    text = text.replace(/\{[ \t]*media +(.*?)[ \t]*\}/gm, function(match, p1) {
        // in questo modo evito i problemi con underscore e smart punctuation
        links.push(p1); 
        return "{media " + (links.length-1).toString() + "}";
    });
    
    let lines = (contentHeader + text + contentFooter).split("\n");
    let lastKlass = "";
    let lastSezione = "";
    let emptyLine = false;
    let prevLine = "";
    let lastRitornello = "";

    let res = "";

    let indiceReset = false;
    let n = 0;
    let indice = "";
    let ultimoMomento = "";

    for (let i in lines) {
        let line = lines[i].trim();
        
        // gestione le righe continuate
        if (prevLine != "") {
            line = prevLine + " " + line;
            prevLine = "";
        }
        if (line.endsWith("\\")) {
            prevLine = line.substr(0, line.length-1);
            continue;
        }

        // eliminazione accordi
        line = line.replace(/\\\[/g, "\uE000");
        line = line.replace(/\[.*?\]/g, "");
        line = line.replace(/_/g, "");

        // la riga vuota inserisce lo spazio tra paragrafi, verrà
        // fatto dopo per evitare spazi multiplo in caso di più linee
        // vuote o cambi di stile
        if (line.length == 0) {
            emptyLine = true;
            continue
        }

        // reset indice 
        if (!indiceReset && line.indexOf("{indice}") != -1) {
            indice = "";
            indiceReset = true;
        }

        // separatore
        if (line.match(/^-+$/)) {
            if (lastKlass != "") {
                res += "</p>\n";
            }
            if (lastSezione != "") {
                res += "</div>\n";
            }
            res += "<hr/>\n";
            lastKlass = "";
            lastSezione = "";
            continue;
        }
        
        // gestione stili
        let klass = "";
        let sezione = "";
        if (line.startsWith("?")) {
            klass = "spiegazione";
            sezione = "header";
            line = line.substr(1);
        } else if (line.startsWith(".")) {
            klass = "momento";
            sezione = "header";
            line = line.substr(1);
            ultimoMomento = line;
        } else if (line.startsWith("##")) {
            klass = "grassetto";
            sezione = "song";
            line = line.substr(2);
        } else if (line.startsWith("#")) {
            klass = "titolo";
            sezione = "header";
            line = line.substr(1);
            let titolo = line;
            if (ultimoMomento != "") {
                titolo = ultimoMomento + ": " + line;
            }
            titolo = titolo.replace(/\{.*?\}/g, "");
            titolo = titolo.replace(/~/g, " ");
            indice += "<a href='#titolo" + n.toString() + "'>" + titolo + "</a><br>\n";
            ultimoMomento = "";
            if (n == 0) {
                document.title = titolo;
            }
            lastRitornello = "";
            let parts = line.split(/(\{.*?\})/);
            for (let i in parts) {
                if (parts[i].startsWith("{") && parts[i].endsWith("}")) {
                    continue;
                }
                if (parts[i] == "") {
                    continue;
                }
                parts[i] = "{% " + parts[i] + "}";
            }
            line = parts.join("");
            n += 1;
        } else if (line.startsWith("/")) {
            klass = "bridge";
            sezione = "song";
            line = line.substr(1);
        } else if (line.startsWith(">")) {
            klass = "ritornello";
            sezione = "song";
            if (line.startsWith(">*") && lastRitornello != "") {
                line = lastRitornello + line.substr(2);
            } else {
                line = line.substr(1);
            }
            if (lastRitornello == "") {
                lastRitornello = line.replace(/[\.,;:]*$/, "...");
            }
        } else if (line.startsWith("%")) {
            if (debug) {
                klass = "debug";
                sezione = "debug";
                line = line.substr(1);
            } else {
                continue;
            }
        } else {
            klass = "strofa";
            sezione = "song";
        }
        if (line.indexOf("%{") >= 0) {
            line = line.replace("%{", "{")
            klass += " debug";
        }
    
        // inserimento eventuale spazio tra paragrafi
        if (klass != lastKlass || emptyLine) {
            if (lastKlass != "") {
                res += "</p>\n";
            }

            if (sezione != lastSezione) {
                if (lastSezione != "") {
                    res += "</div>\n"
                } 
                res += "<div class='" + sezione + "'>\n";
                lastSezione = sezione;
            }
            
            if (klass == "titolo") {
                res += "<a id='titolo" + (n-1).toString() + "'></a>"
            }
            res += "<p class='" + klass + "'>\n";
            lastKlass = klass;
        }

        // "smart" punctuation
        line = line.replace(/(^|\s)'\b/g, "$1‘");
        line = line.replace(/'/g, "’");
        line = line.replace(/(^|\s)"\b/g, "$1“");
        line = line.replace(/"/g, "”");
        line = line.replace(/<</g, "«");
        line = line.replace(/>>/g, "»");
        line = line.replace(/&/g, "&amp;");
        line = line.replace(/</g, "&lt;");
        line = line.replace(/>/g, "&gt;");
        line = line.replace(/\.\.\./g, "…");
        line = line.replace(/---/g, "&#8212;");
        line = line.replace(/--/g, "&#8211;");
        line = line.replace(/~/g, "&nbsp;");
        line = line.replace(/-/g, "&#8209;");

        // gestione escape
        line = line.replace(/\uE000/g, "[");

        // scrittura linea
        emptyLine = false;
        res += line + "<br/>\n";
    }
    res += "</p>\n";
    //res = res.replace("<br/>\n</p>\n", "</p>\n");

    // indice
    indice = indice.substring(0, indice.length - "<br/>".length);
    res = res.replace(/\{indice\}/g, indice);

    // immagini
    for (let k of ["croce", "risposta", "musica"]) {
        let r = new RegExp("\\{" + k + "\\}", "g");
        res = res.replace(r, '<img class="' + k + '" src="' + k + '.svg">');
    }
    res = res.replace(/\{img +(.*?) +(.*?) +(.*?)\}/g, function(match, p1, p2, p3) {
        res  = '<img style="';
        res += 'width: '  + p1 + "; ";
        res += 'height: ' + p2 + "; ";
        res += '" src="'  + p3 + '">';
        return res;
    })
    
    // media
    res = res.replace(/\{media +(.*?)\}/g, function(match, p1) {
        var link = links[parseInt(p1)];
        return '<img class="media" src="youtube.svg" data-link="' + link + '">';
    })

    // tag (span dal titolo)
    res = res.replace(/\{% (.*?)\}/g, function(match, p1) {
        return "<span>" + p1 + "</span>";
    })

    // github
    res = res.replace(/\{github\}/g, `<a href="https://github.com/neclepsio/canti">Tocca&nbsp;qui</a>`);

    return res;
}

function leggiLibreria() {
    let res = {};

    let key = "";
    for (let line of libreria.split("\n")) {
        line = line.trim();

        if (line.startsWith("#")) {
            key = line.replace(/\{.*?\}/g, "").replace(/~/g, " ").substr(1).trim().toLowerCase();
        }
        if (!(key in res)) {
            res[key] = [];
        }
        res[key].push(line);
    }
    for (let key in res) {
        res[key] = res[key].join("\n").trim()
    }

    return res;
}

function main() {
    debug = ((new URL(window.location)).searchParams.get("debug") != null);
    if (debug) {
        onerror = function(errorMsg, url, lineNumber) {
            alertAndLog(errorMsg + "\n" +
                "Url: " + url + "\n" +
                "Line: " + lineNumber);
        
            return false;
        };
    }

    libreriaCanti = leggiLibreria(libreria);
    let contenuto = parseSource(canti);
    document.querySelector("#contenuto").innerHTML = contenuto;

    setEvents();
    handlePopups();
    handleMedia();
    document.body.style.display = null;
    setLetture();
    fixLarghezzaTitoli();

    window.addEventListener("resize", function () {
        fixLarghezzaTitoli();
        setLetture();
    });
}
document.addEventListener("DOMContentLoaded", main);
