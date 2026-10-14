// Keep MVU's machine values separate from translated labels. Older Japanese
// cards wrote localized keys/enums into the shared account settings; accept
// them at this boundary and preserve that storage dialect on subsequent edits.
type Fields = Record<string, [string, Node?]>;
type Node = { fields?: Fields; values?: Record<string, string>; items?: Node };
const enumeration = (values: Record<string, string>): Node => ({ values });
const profile: Node = { fields: {
    名称: ['名前'], api地址: ['apiアドレス'], 密钥: ['APIキー'], 模型名称: ['モデル名'],
} };
const cleanup: Node = { fields: {
    启用: ['有効'], 快照保留间隔: ['スナップショット保持間隔'],
    要保留变量的最近楼层数: ['保持する変数の最近階層スタック数'],
    触发恢复变量的最近楼层数: ['復元をトリガーする変数の最近階層スタック数'],
} };
const compatibility: Node = { fields: {
    更新到聊天变量: ['チャット変数に更新'], 显示老旧功能: ['旧機能を表示'],
    sendas不视为user消息: ['sendasをuserメッセージとみなさない'],
    sandas不视为user消息: ['sandasをuserメッセージとみなさない'],
} };
const extra: Node = { fields: {
    破限方案: ['脱獄方案', enumeration({ 使用内置破限: '内蔵脱獄を使用', 使用当前预设: '現在のプリセットを使用', 使用其他预设: 'その他のプリセットを使用' })],
    其他预设名称: ['その他プリセット名'], 发送预设: ['プリセット送信'], 使用函数调用: ['関数呼び出しを使用'],
    应答格式: ['応答フォーマット', enumeration({ 聊天消息: 'チャットメッセージ', 工具调用: 'ツール呼び出し', 格式化输出: 'フォーマット出力', '格式化输出(v4兼容)': 'フォーマット出力(v4互換)' })],
    关闭thinking: ['thinking無効'], 兼容假流式: ['疑似ストリーミング互換'], 随机头部: ['ランダムヘッダー'],
    启用自动请求: ['自動リクエスト有効'],
    请求方式: ['リクエスト方式', enumeration({ '依次请求，失败后重试': '順番にリクエストし、失敗したら再試行', 同时请求多次: '同時に複数回リクエスト', '先请求一次, 失败后再同时请求多次': '最初に1回リクエストし、失敗したら同時に複数回リクエスト' })],
    请求次数: ['リクエスト回数'], 世界书条目白名单正则: ['ワールドブックエントリホワイトリスト正規表現'], 世界书条目黑名单正则: ['ワールドブックエントリブラックリスト正規表現'],
    模型来源: ['モデル出典', enumeration({ 与插头相同: 'プラグと同じ', 自定义: 'カスタム' })],
    api地址: ['apiアドレス'], 密钥: ['APIキー'], 模型名称: ['モデル名'],
    频率惩罚: ['頻度ペナルティ'], 存在惩罚: ['存在ペナルティ'], 最大回复token数: ['最大応答トークン数'],
    api方案列表: ['apiプロファイル一覧', { items: profile }], 当前api方案: ['現在のapiプロファイル'],
} };
const schema: Node = { fields: {
    通知: ['通知', { fields: {
        MVU框架加载成功: ['MVUフレームワーク読み込み成功'], 变量初始化成功: ['変数初期化成功'],
        变量更新出错: ['変数更新エラー'], 额外模型解析中: ['追加モデル解析中'],
    } }],
    更新方式: ['更新方式', enumeration({ 随AI输出: 'AI出力に従う', 额外模型解析: '追加モデル解析' })],
    额外模型解析配置: ['追加モデル解析設定', extra], 自动清理变量: ['自動クリーンアップ変数', cleanup], 兼容性: ['互換性', compatibility],
    自动触发额外模型解析: ['追加モデル解析を自動トリガー'], 快照保留间隔: ['スナップショット保持間隔'], 更新到聊天变量: ['チャット変数に更新'],
    auto_cleanup: ['auto_cleanup', cleanup], legacy: ['legacy', compatibility],
    internal: ['internal', { fields: {
        已提醒更新了配置界面: ['設定画面更新を通知済み'], 已提醒自动清理旧变量功能: ['自動クリーンアップ旧変数機能を通知済み'],
        已提醒更新了API温度等配置: ['API温度等の設定更新を通知済み'], 已默认开启自动清理旧变量功能: ['自動クリーンアップ旧変数機能を既定で有効化済み'],
        已提醒内置破限: ['内蔵脱獄を通知済み'], 已提醒额外模型同时请求: ['追加モデル同時リクエストを通知済み'],
        已开启默认不兼容假流式: ['既定で疑似ストリーミング非互換を有効化済み'],
    } }],
} };
const object = (value: unknown): value is Record<string, any> => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value: unknown, key: string) => object(value) && Object.prototype.hasOwnProperty.call(value, key);

function decode(value: any, node: Node): any {
    if (node.values) return Object.entries(node.values).find(([, alias]) => alias === value)?.[0] ?? value;
    if (node.items) return Array.isArray(value) ? value.map(item => decode(item, node.items!)) : value;
    if (!object(value)) return value;
    const result = { ...value };
    for (const [key, [alias, child]] of Object.entries(node.fields || {})) {
        if (!own(value, key) && !own(value, alias)) continue;
        let selected = own(value, key) ? value[key] : value[alias];
        if (key !== alias && object(value[key]) && object(value[alias])) selected = { ...value[alias], ...value[key] };
        if (key !== alias) delete result[alias];
        result[key] = child ? decode(selected, child) : selected;
    }
    return result;
}

function encode(value: any, previous: any, node: Node, japanese: boolean): any {
    if (node.values) {
        const wasJapanese = Object.values(node.values).includes(previous);
        const wasCanonical = own(node.values, String(previous));
        return (wasJapanese || (!wasCanonical && japanese)) ? node.values[value] ?? value : value;
    }
    if (node.items) return Array.isArray(value) ? value.map((item, index) => encode(item, previous?.[index], node.items!, japanese)) : value;
    if (!object(value)) return value;
    const result = { ...value };
    for (const [key, [alias, child]] of Object.entries(node.fields || {})) {
        if (!own(value, key)) continue;
        // The host can project canonical retention flags over legacy settings.
        // Existing aliases still determine storage spelling, while decode gives
        // explicit canonical values precedence. Do not erase the old section.
        const target = key !== alias && (own(previous, alias) || (!own(previous, key) && japanese)) ? alias : key;
        let prior = own(previous, key) ? previous[key] : previous?.[alias];
        if (key !== alias && object(previous?.[key]) && object(previous?.[alias])) prior = { ...previous[alias], ...previous[key] };
        if (key !== alias) { delete result[key]; delete result[alias]; }
        result[target] = child ? encode(value[key], prior, child, japanese) : value[key];
    }
    return result;
}

export const decodeMvuSettings = (value: unknown): any => decode(value, schema);
export function encodeMvuSettings(value: unknown, previous: any): any {
    const japanese = own(previous, '追加モデル解析設定') || ['AI出力に従う', '追加モデル解析'].includes(previous?.更新方式);
    return encode(value, previous, schema, japanese);
}
