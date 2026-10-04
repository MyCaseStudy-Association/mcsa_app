import {
  detectConversationLanguage,
  isSellableLanguage,
} from '@/features/sources/services/language-gate';

describe('detectConversationLanguage', () => {
  it('positively identifies English across the whole conversation', () => {
    expect(
      detectConversationLanguage([
        'Can you help me debug this Python function?',
        'It throws an error whenever the input list is empty, and I do not understand why.',
      ]),
    ).toBe('en');
  });

  it('returns other for a non-English conversation', () => {
    expect(
      detectConversationLanguage([
        '¿Puedes ayudarme a escribir una carta de presentación para un trabajo?',
        'Quiero que suene profesional pero también cercana y amable.',
      ]),
    ).toBe('other');
  });

  it('returns und when there is too little text to classify', () => {
    expect(detectConversationLanguage(['thanks', 'ok'])).toBe('und');
    expect(detectConversationLanguage([])).toBe('und');
  });

  it('fails closed: only en is sellable', () => {
    expect(isSellableLanguage('en')).toBe(true);
    expect(isSellableLanguage('other')).toBe(false);
    expect(isSellableLanguage('und')).toBe(false);
  });
});
