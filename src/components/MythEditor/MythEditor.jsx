import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
    isStyledTextInlineContent,
    defaultBlockSpecs,
    BlockNoteSchema
} from "@blocknote/core";
import { useCallback, useMemo, useState, useEffect } from "react";
import {
    useCreateBlockNote,
    SuggestionMenuController,
    getDefaultReactSlashMenuItems,
    FormattingToolbarController,
    FormattingToolbar,
    BlockTypeSelect,
    BasicTextStyleButton,
    TextAlignButton,
    ColorStyleButton,
    NestBlockButton,
    UnnestBlockButton,
    CreateLinkButton,
    FileCaptionButton,
    FileReplaceButton,
    FileRenameButton,
    FileDeleteButton,
    FilePreviewButton,
    useSelectedBlocks
} from "@blocknote/react";
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { RiAlertFill } from "react-icons/ri";
import { FolderOpen } from "lucide-react";
import { ActionIcon, Tooltip } from "@mantine/core";

import { Alert } from "./Blocks/AlertBox";

import * as locales from "@blocknote/core/locales";

import "./MythEditor.css";

const OpenInFinderButton = ({ editor }) => {
    const selectedBlocks = useSelectedBlocks(editor);
    const block = selectedBlocks.length === 1 ? selectedBlocks[0] : null;

    const isFileBlock = block && ['image', 'video', 'audio', 'file'].includes(block.type);

    if (!isFileBlock) {
        return null;
    }

    return (
        <Tooltip label="在 Finder 中打开" withinPortal>
            <ActionIcon 
                size="lg" 
                variant="subtle" 
                color="gray" 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const url = block.props.url;
                    if (url) {
                         window.require('electron').ipcRenderer.invoke('shell:showItemInFolder', url);
                    }
                }}
            >
                <FolderOpen size={16} />
            </ActionIcon>
        </Tooltip>
    );
};

function MythEditor({ lang = "zh", initialContent, onChange, onEditorReady, uploadFile }) {
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
            initialContent: initialContent || [
                {
                    type: "paragraph",
                    content: "开始写作...",
                },
            ],
            uploadFile,
        },
        [schema, lang, uploadFile]
    );

    useEffect(() => {
        if (onEditorReady && editor) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

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
            formattingToolbar={false}
            data-theming-css-variables-demo
            className={isSlashSearching ? "bn-slash-searching" : undefined}
            onChange={() => {
                updateSlashSearchState(editor);
                if (onChange) {
                    onChange(editor.document);
                }
            }}
            onSelectionChange={() => updateSlashSearchState(editor)}
        >
            <SuggestionMenuController
                triggerCharacter="/"
                getItems={async (query) =>
                    filterSuggestionItems(getCustomSlashMenuItems(), query)
                }
            />
            <FormattingToolbarController
                formattingToolbar={() => (
                    <FormattingToolbar>
                        <BlockTypeSelect key={"blockTypeSelect"} />

                        {/* File Block Buttons */}
                        <FileCaptionButton key={"fileCaptionButton"} />
                        <FileReplaceButton key={"replaceFileButton"} />
                        <OpenInFinderButton editor={editor} key={"openInFinderButton"} />
                        <FileRenameButton key={"fileRenameButton"} />
                        <FileDeleteButton key={"fileDeleteButton"} />
                        <FilePreviewButton key={"filePreviewButton"} />

                        {/* Basic Text Styles */}
                        <BasicTextStyleButton basicTextStyle={"bold"} key={"boldStyleButton"} />
                        <BasicTextStyleButton basicTextStyle={"italic"} key={"italicStyleButton"} />
                        <BasicTextStyleButton basicTextStyle={"underline"} key={"underlineStyleButton"} />
                        <BasicTextStyleButton basicTextStyle={"strike"} key={"strikeStyleButton"} />
                        <BasicTextStyleButton basicTextStyle={"code"} key={"codeStyleButton"} />

                        <TextAlignButton textAlignment={"left"} key={"textAlignLeftButton"} />
                        <TextAlignButton textAlignment={"center"} key={"textAlignCenterButton"} />
                        <TextAlignButton textAlignment={"right"} key={"textAlignRightButton"} />

                        <ColorStyleButton key={"colorStyleButton"} />

                        <NestBlockButton key={"nestBlockButton"} />
                        <UnnestBlockButton key={"unnestBlockButton"} />

                        <CreateLinkButton key={"createLinkButton"} />
                    </FormattingToolbar>
                )}
            />
        </BlockNoteView>
    );
}

export default MythEditor
