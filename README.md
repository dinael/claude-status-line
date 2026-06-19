# Claude Code — Status Line

Adds a three-line ANSI status bar to the Claude Code terminal, updated after every response:

- **Context bar** with usage percentage.
- **Estimated cost of the last turn** (input and output tokens per message).
- **Cumulative session token count**.
- **Total session cost** in **$ (USD)** and **€ (approx. EUR)**.
- Active model, session duration, and plan rate-limit gauges.

```
💻 SESSION /· 🤖 model:Sonnet 4.6· 📊 ctx:▓▓▓▓▓░░░░░ 47% 🧠 memo:94.1k/200.0k· 🧩 tokens:209.5k
⚡ LAST.ITER /  ⬆️ in:202tok  ⬇️ out:130tok  🪙 cost:$0.003/€0.002· 💸 total cost:$2.63/€2.42
🔋 PLAN /· ⏳ time:62m· ❗ 5h limit:32% (10m)· 🚧 weekly limit:15% (4d 4h)
```

Labels are rendered in dim grey; values are colour-coded by type:

| Colour | Used for |
|--------|----------|
| Cyan   | Tokens (session, turn input/output) |
| Magenta | Turn cost |
| Green  | Total cost, elapsed time |
| Green/Yellow/Red | Context bar and memo values (by usage %) |

**Line 1 — tokens:**

- `💻 SESSION /` — section header.
- `🤖 model:` + active model name.
- `📊 ctx:▓▓░░ 20%` — context-window usage bar (green < 60 %, yellow ≥ 60 %, red ≥ 85 %).
- `🧠 memo:40k/200k` — token counts, coloured to match the bar.
- `🧩 tokens:` — new tokens accumulated in the session (cache re-reads excluded).

**Line 2 — turn & costs:**

- `⚡ LAST.ITER /  ⬆️ in:Xtok  ⬇️ out:Xtok` — tokens from the **last turn** (input and output).
  Hidden on the very first turn when no prior turn data is available.
- `🪙 cost:` — estimated cost of the last turn in USD and EUR (magenta).
- `💸 total cost:` — cumulative session cost in USD and EUR (green).

**Line 3 — plan:**

- `🔋 PLAN /` — section header.
- `⏳ time:` — elapsed session minutes (green).
- `❗ 5h limit:` / `🚧 weekly limit:` — Claude plan usage (5-hour and weekly caps) with the
  **time remaining** until reset shown in parentheses. Only visible on Pro/Max subscription plans.

## Model pricing

Turn cost is calculated using official Anthropic pricing at the time of publication (2026-06-18).
Check [Anthropic's pricing page](https://www.anthropic.com/pricing) for the latest rates.

| Model  | Input ($/MTok) | Output ($/MTok) |
|--------|----------------|-----------------|
| Opus   | $15            | $75             |
| Sonnet | $3             | $15             |
| Haiku  | $0.80          | $4              |

The model is detected automatically from the name returned by Claude Code.

## Requirement

**Node.js** must be installed. Verify with:

```bash
node -v
```

## Installation

### Step 1 — Copy the script

Copy `statusline.js` to your Claude Code configuration folder:

- **Windows:** `C:\Users\YOUR_USERNAME\.claude\statusline.js`
- **Mac / Linux:** `~/.claude/statusline.js`

### Step 2 — Enable it in `settings.json`

Open `~/.claude/settings.json` (Windows: `C:\Users\YOUR_USERNAME\.claude\settings.json`) and
add the `statusLine` block **inside the root object**, keeping any existing commas valid:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/statusline.js",
    "padding": 0
  }
}
```

On Windows use the absolute path:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:/Users/YOUR_USERNAME/.claude/statusline.js",
    "padding": 0
  }
}
```

If `settings.json` does not exist yet, create it with exactly that content.

### Step 3 — Restart Claude Code

The bar appears in the **next** `claude` session and updates after every response.

## Customisation

- **EUR/USD rate:** edit the `EUR_RATE` constant at the top of `statusline.js` (default `0.92`).

- **Language:** set the `STATUSLINE_LANG` environment variable. Available values:

  | Value | Language | Label examples |
  |-------|----------|----------------|
  | `es`  | Spanish  | `💻 SESIÓN /` `⚡ ÚLT.ITER /` `🔋 PLAN /` |
  | `en`  | English  | `💻 SESSION /` `⚡ LAST.ITER /` `🔋 PLAN /` |
  | `fr`  | French   | `💻 SESSION /` `⚡ DERN.ITER /` `🔋 PLAN /` |

  Defaults to `es` when unset; falls back to `en` for unrecognised values.

  **Set the language for the current session:**

  ```powershell
  # Windows (PowerShell)
  $env:STATUSLINE_LANG = "en"
  claude
  ```
  ```bash
  # Mac / Linux
  STATUSLINE_LANG=en claude
  ```

  **Make it permanent:**

  ```powershell
  # Windows (PowerShell) — add to your profile
  Add-Content $PROFILE '$env:STATUSLINE_LANG = "en"'
  ```
  ```bash
  # Mac / Linux — add to ~/.bashrc or ~/.zshrc
  export STATUSLINE_LANG=en
  ```

## Notes

- Turn cost is an **estimate** derived from transcript tokens and Anthropic list prices.
  On subscription plans it does not reflect actual billing.
- "tokens" sums input + output + cache tokens for every turn (tokens processed), so it is
  typically much larger than the current context window usage.
- The `⚡ LAST.ITER /` segment is hidden on the very first turn because there is no prior turn to measure.
- The separator between items is `· ` (dot then space, no leading space) so that if a line wraps in a narrow terminal, the new visual line starts flush with no leading space.

## Troubleshooting

1. Make sure `settings.json` is valid JSON (correct commas, no trailing commas).
2. Test the script manually:
   ```bash
   # Mac / Linux
   echo '{"model":{"display_name":"Claude Sonnet 4.6"},"context_window":{"context_window_size":200000,"used_percentage":20,"total_input_tokens":40000},"cost":{"total_cost_usd":0.14,"total_duration_ms":480000},"transcript_path":""}' | node ~/.claude/statusline.js
   ```
   ```powershell
   # Windows (PowerShell)
   '{"model":{"display_name":"Claude Sonnet 4.6"},"context_window":{"context_window_size":200000,"used_percentage":20,"total_input_tokens":40000},"cost":{"total_cost_usd":0.14,"total_duration_ms":480000},"transcript_path":""}' | node C:/Users/$env:USERNAME/.claude/statusline.js
   ```
   It should print three lines without errors.

---

## Created by

[David Daganzo](https://github.com/daviddaganzo) · [Dinael Urdaneta](https://github.com/dinael)

---

# Claude Code — Barra de estado

Añade una barra de estado de tres líneas en la terminal de Claude Code, actualizada tras cada respuesta:

- Barra de **contexto** y **porcentaje** usado.
- **Coste estimado del último turno** (tokens enviados y recibidos por cada mensaje).
- **Tokens acumulados** de la sesión.
- **Coste total** de la sesión en **$ (USD)** y **€ (EUR aprox)**.
- Modelo, minutos de sesión y límites del plan.

```
💻 SESIÓN /· 🤖 Modelo:Sonnet 4.6· 📊 ctx:▓▓▓▓▓░░░░░ 47% 🧠 memo:94.1k/200.0k· 🧩 tokens:209.5k
⚡ ÚLT.ITER /  ⬆️ entrada:202tok  ⬇️ salida:130tok  🪙 coste:$0.003/€0.002· 💸 coste total:$2.63/€2.42
🔋 PLAN /· ⏳ tiempo:62m· ❗ límite 5h:32% (10m)· 🚧 límite sem:15% (4d 4h)
```

Los **labels** se muestran en gris tenue y los **valores** en color según su tipo:

| Color   | Usado en |
|---------|----------|
| Cyan    | Tokens (sesión, entrada/salida del turno) |
| Magenta | coste del turno |
| Verde   | coste total, tiempo de sesión |
| Verde/Amarillo/Rojo | Barra de contexto y valores memo (según % de uso) |

**Línea 1 — tokens:**

- `💻 SESIÓN /` — cabecera de sección.
- `🤖 Modelo:` + nombre del modelo activo.
- `📊 ctx:▓▓░░ 20%` — barra de uso del contexto (verde < 60 %, amarillo ≥ 60 %, rojo ≥ 85 %).
- `🧠 memo:40k/200k` — tokens en memoria, con el mismo color que la barra.
- `🧩 tokens:` — tokens nuevos acumulados en la sesión (sin contar relecturas de caché).

**Línea 2 — turno y costes:**

- `⚡ ÚLT.ITER /  ⬆️ entrada:Xtok  ⬇️ salida:Xtok` — tokens del **último turno** (entrada y salida).
  Solo aparece cuando hay datos del turno.
- `🪙 coste:` — coste estimado del último turno en USD y EUR (magenta).
- `💸 coste total:` — coste acumulado de la sesión en USD y EUR (verde).

**Línea 3 — plan:**

- `🔋 PLAN /` — cabecera de sección.
- `⏳ tiempo:` — minutos de sesión (verde).
- `❗ límite 5h:` / `🚧 límite sem:` — uso del plan de Claude (límite de 5 h y semanal) con el
  **tiempo restante** hasta la renovación entre paréntesis. Solo aparece en planes de
  suscripción (Pro/Max).

## Precios por modelo

El coste del turno se calcula con los precios oficiales de Anthropic vigentes en la fecha de publicación (2026-06-18).
Consulta la [página de precios de Anthropic](https://www.anthropic.com/pricing) para las tarifas actuales.

| Modelo | Input ($/MTok) | Output ($/MTok) |
|--------|----------------|-----------------|
| Opus   | $15            | $75             |
| Sonnet | $3             | $15             |
| Haiku  | $0.80          | $4              |

El modelo se detecta automáticamente desde el nombre que devuelve Claude Code.

## Requisito

Tener **Node.js** instalado. Compruébalo con:

```bash
node -v
```

## Instalación

### Paso 1 — Copiar el script

Copia `statusline.js` a tu carpeta de configuración de Claude Code:

- **Windows:** `C:\Users\TU_USUARIO\.claude\statusline.js`
- **Mac / Linux:** `~/.claude/statusline.js`

### Paso 2 — Activarlo en `settings.json`

Abre `~/.claude/settings.json` (en Windows: `C:\Users\TU_USUARIO\.claude\settings.json`) y
añade el bloque `statusLine` **dentro del objeto principal**, respetando las comas del JSON que
ya tengas:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/statusline.js",
    "padding": 0
  }
}
```

En Windows usa la ruta absoluta:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:/Users/TU_USUARIO/.claude/statusline.js",
    "padding": 0
  }
}
```

Si el fichero `settings.json` no existe, créalo con exactamente ese contenido.

### Paso 3 — Reiniciar Claude Code

La barra aparece en la **siguiente** sesión de `claude` y se actualiza tras cada respuesta.

## Personalización

- **Tasa de cambio €/$:** edita la constante `EUR_RATE` al inicio de `statusline.js`
  (por defecto `0.92`).

- **Idioma:** configurable mediante la variable de entorno `STATUSLINE_LANG`. Valores disponibles:

  | Valor | Idioma   | Headers de sección |
  |-------|----------|--------------------|
  | `es`  | Español  | `💻 SESIÓN /` `⚡ ÚLT.ITER /` `🔋 PLAN /` |
  | `en`  | English  | `💻 SESSION /` `⚡ LAST.ITER /` `🔋 PLAN /` |
  | `fr`  | Français | `💻 SESSION /` `⚡ DERN.ITER /` `🔋 PLAN /` |

  Si la variable no está definida se usa `es` por defecto. Si el valor no coincide con ninguno
  de los tres, se usa `en` como fallback.

  **Cambiar el idioma desde la consola** — escribe esto antes de arrancar `claude`:

  ```powershell
  # Windows (PowerShell)
  $env:STATUSLINE_LANG = "en"
  claude
  ```
  ```bash
  # Mac / Linux
  STATUSLINE_LANG=en claude
  ```

  **Hacerlo permanente:**

  ```powershell
  # Windows (PowerShell) — añade al perfil
  Add-Content $PROFILE '$env:STATUSLINE_LANG = "en"'
  ```
  ```bash
  # Mac / Linux — añade a ~/.bashrc o ~/.zshrc
  export STATUSLINE_LANG=en
  ```

## Notas

- El coste del turno es una **estimación** calculada a partir de los tokens del transcript y
  los precios de Anthropic. En planes de suscripción no refleja la facturación real.
- "tokens" suma input + output + caché de cada turno (tokens procesados), por eso suele
  ser bastante mayor que lo que ocupa el contexto actual.
- El segmento `⚡ ÚLT.ITER /` no aparece en el primer arranque porque no hay turno previo que medir.
- El separador entre items es `· ` (punto y espacio, sin espacio delante) para que si una línea hace wrap en un terminal estrecho, la continuación visual empiece sin espacio inicial.

## Si no aparece la barra

1. Verifica que `settings.json` es JSON válido (comas correctas, sin comas finales sobrantes).
2. Prueba el script manualmente:
   ```bash
   # Mac / Linux
   echo '{"model":{"display_name":"Claude Sonnet 4.6"},"context_window":{"context_window_size":200000,"used_percentage":20,"total_input_tokens":40000},"cost":{"total_cost_usd":0.14,"total_duration_ms":480000},"transcript_path":""}' | node ~/.claude/statusline.js
   ```
   ```powershell
   # Windows (PowerShell)
   '{"model":{"display_name":"Claude Sonnet 4.6"},"context_window":{"context_window_size":200000,"used_percentage":20,"total_input_tokens":40000},"cost":{"total_cost_usd":0.14,"total_duration_ms":480000},"transcript_path":""}' | node C:/Users/$env:USERNAME/.claude/statusline.js
   ```
   Debe imprimir tres líneas sin error.

---

## Creado por

[David Daganzo](https://github.com/daviddaganzo) · [Dinael Urdaneta](https://github.com/dinael)

---

# Claude Code — Barre de statut

Ajoute une barre de statut de trois lignes dans le terminal Claude Code, mise à jour après chaque réponse :

- **Barre de contexte** avec pourcentage d'utilisation.
- **Coût estimé du dernier tour** (tokens envoyés et reçus par message).
- **Compteur de tokens** accumulés pour la session.
- **Coût total** de la session en **$ (USD)** et **€ (EUR approx.)**.
- Modèle actif, durée de session et jauges de limite du plan.

```
💻 SESSION /· 🤖 modèle:Sonnet 4.6· 📊 ctx:▓▓▓▓▓░░░░░ 47% 🧠 memo:94.1k/200.0k· 🧩 tokens:209.5k
⚡ DERN.ITER /  ⬆️ entrée:202tok  ⬇️ sortie:130tok  🪙 coût:$0.003/€0.002· 💸 coût total:$2.63/€2.42
🔋 PLAN /· ⏳ temps:62m· ❗ limite 5h:32% (10m)· 🚧 limite sem:15% (4d 4h)
```

Les **labels** s'affichent en gris atténué et les **valeurs** sont colorées selon leur type :

| Couleur | Utilisée pour |
|---------|---------------|
| Cyan    | Tokens (session, entrée/sortie du tour) |
| Magenta | Coût du tour |
| Vert    | Coût total, temps de session |
| Vert/Jaune/Rouge | Barre de contexte et valeurs memo (selon % d'utilisation) |

**Ligne 1 — tokens :**

- `💻 SESSION /` — en-tête de section.
- `🤖 modèle:` + nom du modèle actif.
- `📊 ctx:▓▓░░ 20%` — barre d'utilisation du contexte (vert < 60 %, jaune ≥ 60 %, rouge ≥ 85 %).
- `🧠 memo:40k/200k` — compteur de tokens, coloré comme la barre.
- `🧩 tokens:` — nouveaux tokens accumulés dans la session (relectures du cache exclues).

**Ligne 2 — tour et coûts :**

- `⚡ DERN.ITER /  ⬆️ entrée:Xtok  ⬇️ sortie:Xtok` — tokens du **dernier tour** (entrée et sortie).
  Masqué au tout premier tour faute de données de tour précédent.
- `🪙 coût:` — coût estimé du dernier tour en USD et EUR (magenta).
- `💸 coût total:` — coût cumulé de la session en USD et EUR (vert).

**Ligne 3 — plan :**

- `🔋 PLAN /` — en-tête de section.
- `⏳ temps:` — minutes de session écoulées (vert).
- `❗ limite 5h:` / `🚧 limite sem:` — utilisation du plan Claude (limites 5 h et hebdomadaire) avec le
  **temps restant** avant réinitialisation entre parenthèses. Visible uniquement sur les plans
  d'abonnement Pro/Max.

## Tarification par modèle

Le coût du tour est calculé avec les tarifs officiels d'Anthropic en vigueur à la date de publication (2026-06-18).
Consultez la [page de tarification d'Anthropic](https://www.anthropic.com/pricing) pour les tarifs actuels.

| Modèle | Entrée ($/MTok) | Sortie ($/MTok) |
|--------|-----------------|-----------------|
| Opus   | $15             | $75             |
| Sonnet | $3              | $15             |
| Haiku  | $0.80           | $4              |

Le modèle est détecté automatiquement depuis le nom renvoyé par Claude Code.

## Prérequis

**Node.js** doit être installé. Vérifiez avec :

```bash
node -v
```

## Installation

### Étape 1 — Copier le script

Copiez `statusline.js` dans votre dossier de configuration Claude Code :

- **Windows :** `C:\Users\VOTRE_NOM\.claude\statusline.js`
- **Mac / Linux :** `~/.claude/statusline.js`

### Étape 2 — L'activer dans `settings.json`

Ouvrez `~/.claude/settings.json` (Windows : `C:\Users\VOTRE_NOM\.claude\settings.json`) et
ajoutez le bloc `statusLine` **à l'intérieur de l'objet racine**, en respectant les virgules JSON existantes :

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/statusline.js",
    "padding": 0
  }
}
```

Sur Windows, utilisez le chemin absolu :

```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:/Users/VOTRE_NOM/.claude/statusline.js",
    "padding": 0
  }
}
```

Si `settings.json` n'existe pas encore, créez-le avec exactement ce contenu.

### Étape 3 — Redémarrer Claude Code

La barre apparaît à la **prochaine** session `claude` et se met à jour après chaque réponse.

## Personnalisation

- **Taux de change €/$ :** modifiez la constante `EUR_RATE` en haut de `statusline.js`
  (valeur par défaut : `0.92`).

- **Langue :** configurable via la variable d'environnement `STATUSLINE_LANG`. Valeurs disponibles :

  | Valeur | Langue   | Exemples d'en-têtes |
  |--------|----------|---------------------|
  | `es`   | Español  | `💻 SESIÓN /` `⚡ ÚLT.ITER /` `🔋 PLAN /` |
  | `en`   | English  | `💻 SESSION /` `⚡ LAST.ITER /` `🔋 PLAN /` |
  | `fr`   | Français | `💻 SESSION /` `⚡ DERN.ITER /` `🔋 PLAN /` |

  Utilise `es` par défaut si la variable n'est pas définie ; bascule sur `en` pour toute valeur non reconnue.

  **Changer la langue pour la session en cours :**

  ```powershell
  # Windows (PowerShell)
  $env:STATUSLINE_LANG = "fr"
  claude
  ```
  ```bash
  # Mac / Linux
  STATUSLINE_LANG=fr claude
  ```

  **Rendre le changement permanent :**

  ```powershell
  # Windows (PowerShell) — ajouter au profil
  Add-Content $PROFILE '$env:STATUSLINE_LANG = "fr"'
  ```
  ```bash
  # Mac / Linux — ajouter à ~/.bashrc ou ~/.zshrc
  export STATUSLINE_LANG=fr
  ```

## Notes

- Le coût du tour est une **estimation** calculée à partir des tokens du transcript et des tarifs
  Anthropic. Sur les plans d'abonnement, il ne reflète pas la facturation réelle.
- « tokens » additionne entrée + sortie + cache de chaque tour (tokens traités), ce qui est
  généralement bien supérieur à l'utilisation actuelle de la fenêtre de contexte.
- Le segment `⚡ DERN.ITER /` n'apparaît pas au premier démarrage car il n'y a pas de tour précédent à mesurer.
- Le séparateur entre les éléments est `· ` (point puis espace, sans espace initial) afin que si
  une ligne se coupe dans un terminal étroit, la continuation visuelle commence sans espace.

## Si la barre n'apparaît pas

1. Vérifiez que `settings.json` est du JSON valide (virgules correctes, pas de virgule finale).
2. Testez le script manuellement :
   ```bash
   # Mac / Linux
   echo '{"model":{"display_name":"Claude Sonnet 4.6"},"context_window":{"context_window_size":200000,"used_percentage":20,"total_input_tokens":40000},"cost":{"total_cost_usd":0.14,"total_duration_ms":480000},"transcript_path":""}' | node ~/.claude/statusline.js
   ```
   ```powershell
   # Windows (PowerShell)
   '{"model":{"display_name":"Claude Sonnet 4.6"},"context_window":{"context_window_size":200000,"used_percentage":20,"total_input_tokens":40000},"cost":{"total_cost_usd":0.14,"total_duration_ms":480000},"transcript_path":""}' | node C:/Users/$env:USERNAME/.claude/statusline.js
   ```
   Le script doit afficher trois lignes sans erreur.

---

## Créé par

[David Daganzo](https://github.com/daviddaganzo) · [Dinael Urdaneta](https://github.com/dinael)
