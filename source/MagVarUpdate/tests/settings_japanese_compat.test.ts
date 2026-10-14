import { decodeMvuSettings, encodeMvuSettings } from '@/settings_compat';
import { useDataStore } from '@/store';
import { nextTick } from 'vue';

const japanese = () => ({
    更新方式: 'AI出力に従う',
    通知: { MVUフレームワーク読み込み成功: false, 変数初期化成功: false, 変数更新エラー: true, 追加モデル解析中: false },
    追加モデル解析設定: {
        脱獄方案: 'その他のプリセットを使用', その他プリセット名: 'Fixture preset', 応答フォーマット: 'フォーマット出力(v4互換)',
        自動リクエスト有効: false, リクエスト方式: '同時に複数回リクエスト', リクエスト回数: 7,
        モデル出典: 'カスタム', apiアドレス: 'https://example.test/v1', APIキー: 'fixture-only', モデル名: 'fixture-model',
        温度: 0.4, 頻度ペナルティ: 0.2, 存在ペナルティ: 0.3, 最大応答トークン数: 1234,
        apiプロファイル一覧: [{ 名前: 'Fixture', apiアドレス: 'https://example.test/v1', APIキー: 'fixture-only', モデル名: 'fixture-model', unknownProfile: [1, 2] }],
        現在のapiプロファイル: 'Fixture', unknownConfig: { keep: true },
    },
    自動クリーンアップ変数: { 有効: false, スナップショット保持間隔: 43, 保持する変数の最近階層スタック数: 37, 復元をトリガーする変数の最近階層スタック数: 17 },
    互換性: { チャット変数に更新: true, 旧機能を表示: true, sendasをuserメッセージとみなさない: true },
    internal: { 自動クリーンアップ旧変数機能を通知済み: true, 自動クリーンアップ旧変数機能を既定で有効化済み: true, 既定で疑似ストリーミング非互換を有効化済み: true },
    unknownRoot: { text: 'AI出力に従う', keep: [1, '随AI输出'] },
});

describe('Japanese account settings compatibility', () => {
    beforeEach(() => { (globalThis as any).SillyTavern.extensionSettings = {}; });
    afterEach(() => { (globalThis as any).SillyTavern.extensionSettings = {}; });

    test('reads localized settings without replacing unrelated values with defaults', () => {
        const original = japanese();
        (globalThis as any).SillyTavern.extensionSettings.mvu_settings = original;
        const store = useDataStore();
        expect(store.settings.更新方式).toBe('随AI输出');
        expect(store.settings.通知.变量更新出错).toBe(true);
        expect(store.settings.额外模型解析配置).toMatchObject({ 破限方案: '使用其他预设', 其他预设名称: 'Fixture preset', 应答格式: '格式化输出(v4兼容)', 启用自动请求: false, 请求方式: '同时请求多次', 请求次数: 7, 模型来源: '自定义', 密钥: 'fixture-only', 温度: 0.4, 最大回复token数: 1234, unknownConfig: { keep: true } });
        expect(store.settings.自动清理变量).toMatchObject({ 启用: false, 快照保留间隔: 43, 要保留变量的最近楼层数: 37, 触发恢复变量的最近楼层数: 17 });
        expect(store.settings.兼容性.更新到聊天变量).toBe(true);
        expect((store.settings as any).unknownRoot).toEqual(original.unknownRoot);
        expect((globalThis as any).SillyTavern.extensionSettings.mvu_settings).toEqual(original);
    });

    test('saves changed settings in the existing Japanese dialect for other cards and reloads', async () => {
        (globalThis as any).SillyTavern.extensionSettings.mvu_settings = japanese();
        const store = useDataStore();
        store.settings.额外模型解析配置.温度 = 0.7;
        store.settings.更新方式 = '额外模型解析';
        await nextTick();
        const stored = (globalThis as any).SillyTavern.extensionSettings.mvu_settings;
        expect(stored.更新方式).toBe('追加モデル解析');
        expect(stored.追加モデル解析設定.温度).toBe(0.7);
        expect(stored.追加モデル解析設定.APIキー).toBe('fixture-only');
        expect(stored).not.toHaveProperty('额外模型解析配置');
        expect(stored.自動クリーンアップ変数.有効).toBe(false);
        store._reload_settings();
        expect(store.settings.更新方式).toBe('额外模型解析');
        expect(store.settings.额外模型解析配置.温度).toBe(0.7);
    });

    test('canonical accounts and new accounts continue storing canonical keys and enums', async () => {
        const store = useDataStore();
        store.settings.额外模型解析配置.温度 = 0.6;
        await nextTick();
        const stored = (globalThis as any).SillyTavern.extensionSettings.mvu_settings;
        expect(stored.更新方式).toBe('随AI输出');
        expect(stored.额外模型解析配置.温度).toBe(0.6);
        expect(stored).not.toHaveProperty('追加モデル解析設定');
    });

    test('canonical values win mixed inputs while unknown fields and falsy values survive', () => {
        const input: any = japanese();
        input.额外模型解析配置 = { 温度: 0, 请求次数: 0 };
        input.自动清理变量 = { 启用: false };
        const decoded = decodeMvuSettings(input);
        expect(decoded.额外模型解析配置).toMatchObject({ 温度: 0, 请求次数: 0, unknownConfig: { keep: true }, 密钥: 'fixture-only' });
        expect(decoded.自动清理变量.启用).toBe(false);
        const encoded = encodeMvuSettings(decoded, input);
        expect(encoded.追加モデル解析設定.温度).toBe(0);
        expect(encoded.unknownRoot).toEqual(input.unknownRoot);
    });

    test('host retention projections do not change the legacy storage section or its other preferences', () => {
        const previous: any = japanese();
        previous.自动清理变量 = { 启用: false };
        previous.internal.已默认开启自动清理旧变量功能 = true;
        const encoded = encodeMvuSettings(decodeMvuSettings(previous), previous);
        expect(encoded.自動クリーンアップ変数).toEqual(japanese().自動クリーンアップ変数);
        expect(encoded).not.toHaveProperty('自动清理变量');
        expect(encoded.internal).not.toHaveProperty('已默认开启自动清理旧变量功能');
    });

    test('round trips every known localized field without mutating the input', () => {
        const input = japanese(), before = JSON.stringify(input);
        expect(encodeMvuSettings(decodeMvuSettings(input), input)).toEqual(input);
        expect(JSON.stringify(input)).toBe(before);
    });

    test.each([
        ['AI出力に従う', '随AI输出'], ['追加モデル解析', '额外模型解析'],
    ])('maps update mode %s without interpreting unrelated strings', (localized, canonical) => {
        const input = { 更新方式: localized, unknown: localized };
        expect(decodeMvuSettings(input)).toEqual({ 更新方式: canonical, unknown: localized });
        expect(encodeMvuSettings(decodeMvuSettings(input), input)).toEqual(input);
    });
});
