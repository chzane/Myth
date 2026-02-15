import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
    isStyledTextInlineContent,
    defaultBlockSpecs,
    BlockNoteSchema
} from "@blocknote/core";
import { useCallback, useMemo, useState } from "react";
import {
    useCreateBlockNote,
    SuggestionMenuController,
    getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { RiAlertFill } from "react-icons/ri";

import { Alert } from "./Blocks/AlertBox";

import * as locales from "@blocknote/core/locales";

import "./MythEditor.css";

function MythEditor({ lang = "zh" }) {
    const alertLabels = useMemo(() => {
        const isZh = typeof lang === "string" && lang.toLowerCase().startsWith("zh");
        if (isZh) {
            return {
                blockTitle: "提示框",
                blockSubtext: "插入提示框",
                group: "高级功能",
                menuLabel: "提示类型",
                aliases: ["提示框", "提示", "警告", "告警", "alert"],
                types: {
                    warning: "警告",
                    error: "错误",
                    info: "信息",
                    success: "成功",
                },
            };
        }
        return {
            blockTitle: "Alert",
            blockSubtext: "Insert alert box",
            group: "Advanced",
            menuLabel: "Alert Type",
            aliases: ["alert", "warning", "error", "info", "success"],
            types: {
                warning: "Warning",
                error: "Error",
                info: "Info",
                success: "Success",
            },
        };
    }, [lang]);

    const schema = useMemo(
        () =>
            BlockNoteSchema.create({
                blockSpecs: {
                    ...defaultBlockSpecs,
                    alert: Alert(alertLabels)(),
                },
            }),
        [alertLabels]
    );

    const editor = useCreateBlockNote(
        {
            schema,
            dictionary: locales[lang] || locales.en,
            tabBehavior: "prefer-indent",
            initialContent: [
                {
                    type: "paragraph",
                    content: "Hello world!",
                },
                {
                    type: "paragraph",
                },
            ],
        },
        [schema, lang]
    );

    const [isSlashSearching, setIsSlashSearching] = useState(false);

    const updateSlashSearchState = useCallback(
        (targetEditor) => {
            const { block } = targetEditor.getTextCursorPosition();
            if (!Array.isArray(block.content)) {
                setIsSlashSearching(false);
                return;
            }
            const text = block.content
                .map((item) =>
                    isStyledTextInlineContent(item) && item.type === "text" ? item.text : ""
                )
                .join("");
            setIsSlashSearching(text.startsWith("/") && text.length > 1);
        },
        []
    );

    const getCustomSlashMenuItems = useCallback(() => {
        const items = getDefaultReactSlashMenuItems(editor);
        const alertItem = {
            key: "alert",
            title: alertLabels.blockTitle,
            subtext: alertLabels.blockSubtext,
            group: alertLabels.group,
            icon: <RiAlertFill size={18} />,
            onItemClick: () =>
                insertOrUpdateBlockForSlashMenu(editor, {
                    type: "alert",
                    props: { type: "warning" },
                }),
            aliases: alertLabels.aliases,
        };
        const insertIndex = items
            .map((item, index) => (item.group === alertLabels.group ? index : -1))
            .filter((index) => index !== -1)
            .pop();
        const mergedItems = [...items];
        if (typeof insertIndex === "number") {
            mergedItems.splice(insertIndex + 1, 0, alertItem);
        } else {
            mergedItems.push(alertItem);
        }
        return mergedItems;
    }, [alertLabels, editor]);

    return (
        <BlockNoteView
            editor={editor}
            slashMenu={false}
            data-theming-css-variables-demo
            className={isSlashSearching ? "bn-slash-searching" : undefined}
            onChange={updateSlashSearchState}
            onSelectionChange={() => updateSlashSearchState(editor)}
        >
            <SuggestionMenuController
                triggerCharacter="/"
                getItems={async (query) =>
                    filterSuggestionItems(getCustomSlashMenuItems(), query)
                }
            />
        </BlockNoteView>
    );
}

export default MythEditor
