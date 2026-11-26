export interface ParsedTableResult {
  delimiter: ';' | ',' | '\t';
  rows: string[][];
  totalLines: number;
  truncated: boolean;
}

const WORKER_SCRIPT = `
self.onmessage = function(e) {
  const { text, delimiter, maxRows } = e.data;
  const delim = delimiter;
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const len = text.length;
  let lastProgress = 0;

  for (let i = 0; i < len; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delim) {
        row.push(field);
        field = '';
      } else if (ch === '\\r' && next === '\\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\\n' || ch === '\\r') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }

    if (rows.length >= maxRows) {
      self.postMessage({
        type: 'done',
        result: { delimiter: delim, rows, totalLines: rows.length, truncated: i < len - 1 }
      });
      return;
    }

    if (i % 8000 === 0 && len > 0) {
      const pct = Math.min(95, Math.round((i / len) * 100));
      if (pct !== lastProgress) {
        lastProgress = pct;
        self.postMessage({ type: 'progress', progress: pct });
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  self.postMessage({
    type: 'done',
    result: { delimiter: delim, rows, totalLines: rows.length, truncated: false }
  });
};
`;

export function detectDelimiter(sampleText: string): ';' | ',' | '\t' {
  const firstLine = sampleText.split(/\r?\n/)[0] ?? '';
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  if (tabs >= semis && tabs >= commas && tabs > 0) return '\t';
  if (semis >= commas && semis > 0) return ';';
  return ',';
}

function parseSync(
  text: string,
  delimiter: ';' | ',' | '\t',
  maxRows: number
): ParsedTableResult {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const len = text.length;

  for (let i = 0; i < len; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
    if (rows.length >= maxRows) {
      return {
        delimiter,
        rows,
        totalLines: rows.length,
        truncated: i < len - 1,
      };
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return { delimiter, rows, totalLines: rows.length, truncated: false };
}

export function parseCsvInWorker(
  text: string,
  options: {
    delimiter?: ';' | ',' | '\t';
    maxRows?: number;
    onProgress?: (pct: number) => void;
    signal?: AbortSignal;
  } = {}
): Promise<ParsedTableResult> {
  const delimiter = options.delimiter ?? detectDelimiter(text);
  const maxRows = options.maxRows ?? 10000;

  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new DOMException('Analyse annulée', 'AbortError'));
      return;
    }

    if (typeof Worker === 'undefined' || typeof Blob === 'undefined') {
      options.onProgress?.(100);
      resolve(parseSync(text, delimiter, maxRows));
      return;
    }

    let worker: Worker | null = null;
    let blobUrl = '';

    const cleanup = () => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = '';
      }
    };

    try {
      const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
      blobUrl = URL.createObjectURL(blob);
      worker = new Worker(blobUrl);

      const onAbort = () => {
        cleanup();
        reject(new DOMException('Analyse annulée', 'AbortError'));
      };
      options.signal?.addEventListener('abort', onAbort, { once: true });

      worker.onmessage = (event) => {
        const msg = event.data;
        if (msg.type === 'progress') {
          options.onProgress?.(msg.progress);
        } else if (msg.type === 'done') {
          options.onProgress?.(100);
          options.signal?.removeEventListener('abort', onAbort);
          cleanup();
          resolve(msg.result as ParsedTableResult);
        }
      };

      worker.onerror = () => {
        options.signal?.removeEventListener('abort', onAbort);
        cleanup();
        options.onProgress?.(100);
        resolve(parseSync(text, delimiter, maxRows));
      };

      worker.postMessage({ text, delimiter, maxRows });
    } catch {
      cleanup();
      options.onProgress?.(100);
      resolve(parseSync(text, delimiter, maxRows));
    }
  });
}

/**
 * Multi-lingual column alias dictionary (FR / AR / EN) for Import Wizard auto-mapping
 */
export const COLUMN_ALIAS_DICTIONARY: Record<string, string[]> = {
  code: ['code', 'id', 'matricule', 'reference', 'référence', 'الرمز', 'الرقم'],
  firstName: ['prenom', 'prénom', 'firstname', 'first_name', 'الاسم الشخصي', 'الاسم'],
  lastName: ['nom', 'lastname', 'last_name', 'nom de famille', 'الاسم العائلي', 'النسب'],
  fullName: ['nom complet', 'fullname', 'enseignant', 'professeur', 'name', 'الاسم الكامل'],
  level: ['niveau', 'classe', 'level', 'filiere', 'filière', 'المستوى'],
  phone: ['telephone', 'téléphone', 'tel', 'gsm', 'mobile', 'phone', 'الهاتف'],
  whatsappPhone: ['whatsapp', 'wa', 'واتساب'],
  email: ['email', 'e-mail', 'mail', 'courriel', 'البريد الإلكتروني'],
  siteName: ['site', 'centre', 'campus', 'etablissement', 'المركز', 'الفرع'],
  groupNames: ['groupe', 'groupes', 'classe', 'group', 'المجموعة'],
  status: ['statut', 'etat', 'état', 'status', 'الحالة'],
  balanceMad: ['solde', 'solde mad', 'reste', 'balance', 'الرصيد'],
  discountPercent: ['remise', 'remise %', 'reduction', 'réduction', 'discount', 'الخصم'],
  relation: ['relation', 'lien', 'parente', 'parenté', 'صلة القرابة'],
  preferredLang: ['langue', 'lang', 'language', 'اللغة'],
  subjects: ['matiere', 'matière', 'matieres', 'subjects', 'المادة'],
  compType: ['mode paie', 'remuneration', 'rémunération', 'comptype'],
  rateValue: ['taux', 'tarif', 'rate'],
  category: ['categorie', 'catégorie', 'category', 'الفئة'],
  supplier: ['fournisseur', 'supplier', 'tiers', 'المزود'],
  amountMad: ['montant', 'montant mad', 'somme', 'amount', 'total', 'المبلغ'],
  dateISO: ['date', 'dateiso', 'التاريخ'],
  method: ['mode', 'methode', 'méthode', 'paiement', 'method', 'طريقة الدفع'],
  notes: ['notes', 'note', 'observation', 'commentaire', 'ملاحظات'],
};

export function suggestFieldMapping(
  headerName: string,
  targetKeys: Array<{ key: string; label: string }>
): string {
  const normalized = headerName.trim().toLowerCase();
  if (!normalized) return '__ignore__';

  for (const target of targetKeys) {
    if (
      target.key.toLowerCase() === normalized ||
      target.label.toLowerCase() === normalized
    ) {
      return target.key;
    }
    const aliases = COLUMN_ALIAS_DICTIONARY[target.key] ?? [];
    if (aliases.some((alias) => normalized.includes(alias))) {
      return target.key;
    }
  }
  return '__ignore__';
}
