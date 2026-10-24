import { apiClient } from './client';

export interface PolicyDto {
  id?: string;
  title?: string;
  content?: string;
  terms?: string;
}

function cleanPolicyString(val: any): string {
  if (!val) return '';
  let str = '';
  if (typeof val === 'string') {
    str = val.trim();
  } else if (val && typeof val === 'object') {
    if (typeof val.content === 'string') str = val.content.trim();
    else if (typeof val.terms === 'string') str = val.terms.trim();
    else if (typeof val.policy === 'string') str = val.policy.trim();
    else str = JSON.stringify(val);
  } else {
    str = String(val).trim();
  }

  // Handle JSON-encoded strings with surrounding quotes and escaped newlines
  if (str.startsWith('"') && str.endsWith('"') && str.length > 2) {
    try {
      const parsed = JSON.parse(str);
      if (typeof parsed === 'string') str = parsed.trim();
    } catch {
      // Keep raw
    }
  }

  return str;
}

export const policyService = {
  /**
   * GET /api/Policy/get-policy?lang=1
   * Calls the live policy endpoint directly from backend.
   */
  async getPolicy(lang: number = 1): Promise<string> {
    const res = await apiClient.get('/api/Policy/get-policy', {
      params: { lang },
      headers: { Accept: '*/*' }
    });
    return cleanPolicyString(res.data);
  },

  /**
   * GET /api/TermsAndConditions/get-terms?lang=1
   */
  async getTerms(lang: number = 1): Promise<string> {
    const res = await apiClient.get('/api/TermsAndConditions/get-terms', {
      params: { lang },
      headers: { Accept: '*/*' }
    });
    return cleanPolicyString(res.data);
  },

  /**
   * GET /api/RefundPolicy/get-refund?lang=1
   */
  async getRefundPolicy(lang: number = 1): Promise<string> {
    const res = await apiClient.get('/api/RefundPolicy/get-refund', {
      params: { lang },
      headers: { Accept: '*/*' }
    });
    return cleanPolicyString(res.data);
  }
};
