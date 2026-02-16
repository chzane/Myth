import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
    isStyledTextInlineContent,
    defaultBlockSpecs,
    defaultStyleSpecs,
    BlockNoteSchema,
    createStyleSpec
} from "@blocknote/core";
import { useCallback, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    useCreateBlockNote,
    SuggestionMenuController,
    getDefaultReactSlashMenuItems,
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
    useSelectedBlocks,
    useComponentsContext,
    useActiveStyles
} from "@blocknote/react";
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { RiAlertFill } from "react-icons/ri";
import { FolderOpen } from "lucide-react";
import { ActionIcon, Tooltip } from "@mantine/core";

import { Alert } from "./Blocks/AlertBox";

import * as locales from "@blocknote/core/locales";

import "./MythEditor.css";

const OpenInFinderButton = ({ editor }) => {
    const components = useComponentsContext();
    const selectedBlocks = useSelectedBlocks(editor);
    const block = selectedBlocks.length === 1 ? selectedBlocks[0] : null;

    const isFileBlock = block && ['image', 'video', 'audio', 'file'].includes(block.type);

    if (!isFileBlock || !components) {
        return null;
    }

    const { Button: ToolbarButton } = components.FormattingToolbar;

    return (
        <ToolbarButton
            mainTooltip="在 Finder 中打开"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = block.props.url;
                if (url) {
                        window.require('electron').ipcRenderer.invoke('shell:showItemInFolder', url);
                }
            }}
            icon={<FolderOpen size={16} />}
        />
    );
};

const FontSizeSelect = ({ editor }) => {
    const components = useComponentsContext();
    const activeStyles = useActiveStyles(editor);
    const selectedBlocks = useSelectedBlocks(editor);
    
    // Only show if we have text content or selection allows text styling
    // If a file block is selected, we might want to hide this.
    // Check if current selection supports text styles.
    // Actually simpler: if selection contains file blocks, hide?
    // BlockNote selection can be mixed.
    // Let's hide if only file blocks are selected?
    // Or check activeStyles.
    
    // A simpler heuristic: hide if selection is a file block.
    const isFileBlock = selectedBlocks.length > 0 && selectedBlocks.every(block => ['image', 'video', 'audio', 'file'].includes(block.type));
    
    if (!components || isFileBlock) return null;
    const { Select } = components.FormattingToolbar;

    const fontSizes = [
        { text: "初号", value: "56px" },
        { text: "小初", value: "48px" },
        { text: "一号", value: "34.6px" },
        { text: "小一", value: "32px" },
        { text: "二号", value: "29.3px" },
        { text: "小二", value: "24px" },
        { text: "三号", value: "21.3px" },
        { text: "小三", value: "20px" },
        { text: "四号", value: "18.6px" },
        { text: "小四", value: "16px" },
        { text: "五号", value: "14px" },
        { text: "小五", value: "12px" },
        { text: "六号", value: "10px" },
        { text: "小六", value: "8.6px" },
        { text: "七号", value: "7.3px" },
        { text: "八号", value: "6.6px" },
        { text: "12px", value: "12px" },
        { text: "14px", value: "14px" },
        { text: "16px", value: "16px" },
        { text: "18px", value: "18px" },
        { text: "20px", value: "20px" },
        { text: "24px", value: "24px" },
        { text: "30px", value: "30px" },
        { text: "36px", value: "36px" },
        { text: "48px", value: "48px" },
        { text: "60px", value: "60px" },
        { text: "72px", value: "72px" },
    ];

    const currentFontSize = activeStyles.fontSize || "默认";

    // Need to ensure one item is selected for the Select to show something?
    // Or add a default item if none matches.
    
    const items = fontSizes.map(fs => ({
        text: fs.text,
        onClick: () => {
            editor.addStyles({ fontSize: fs.value });
        },
        isSelected: activeStyles.fontSize === fs.value,
        icon: null // Icons are optional
    }));

    // Add a default/reset option
    items.unshift({
        text: "默认字号",
        onClick: () => {
            editor.removeStyles({ fontSize: activeStyles.fontSize });
        },
        isSelected: !activeStyles.fontSize,
        icon: null
    });

    return (
        <Select
            className="w-32"
            items={items}
            // If Select component relies on selected item to show label, this is fine.
        />
    );
};

const FontFamilySelect = ({ editor }) => {
    const components = useComponentsContext();
    const activeStyles = useActiveStyles(editor);
    const selectedBlocks = useSelectedBlocks(editor);

    const isFileBlock = selectedBlocks.length > 0 && selectedBlocks.every(block => ['image', 'video', 'audio', 'file'].includes(block.type));
    
    if (!components || isFileBlock) return null;
    const { Select } = components.FormattingToolbar;

    const fonts = [
        { text: "宋体", value: "SimSun, 'Songti SC', serif" },
        { text: "黑体", value: "SimHei, 'Heiti SC', sans-serif" },
        { text: "楷体", value: "KaiTi, 'Kaiti SC', serif" },
        { text: "仿宋", value: "FangSong, 'FangSong SC', serif" },
        { text: "Arial", value: "Arial, sans-serif" },
        { text: "Times New Roman", value: "'Times New Roman', serif" },
        { text: "Courier New", value: "'Courier New', monospace" },
        { text: "Verdana", value: "Verdana, sans-serif" },
        { text: "Georgia", value: "Georgia, serif" },
    ];

    const items = fonts.map(f => ({
        text: f.text,
        onClick: () => {
            editor.addStyles({ fontFamily: f.value });
        },
        isSelected: activeStyles.fontFamily === f.value,
        icon: null
    }));

     items.unshift({
        text: "默认字体",
        onClick: () => {
             editor.removeStyles({ fontFamily: activeStyles.fontFamily });
        },
        isSelected: !activeStyles.fontFamily,
        icon: null
    });

    return (
        <Select
            className="w-32"
            items={items}
        />
    );
};

const ToolbarPortal = ({ container, children }) => {
    return container ? createPortal(
        <div className="myth-toolbar-scroll-wrapper">
            {children}
        </div>,
        container
    ) : null;
};

function MythEditor({ lang = "zh", initialContent, onChange, onEditorReady, uploadFile, darkMode }) {
    const [toolbarContainer, setToolbarContainer] = useState(null);
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

    const logToMain = useCallback((...args) => {
        try {
            const { ipcRenderer } = window.require("electron");
            ipcRenderer.send("log:renderer", ...args);
        } catch (error) {
            console.log(...args);
        }
    }, []);

    const blockSpecs = useMemo(() => {
        const merged = {
            ...defaultBlockSpecs,
            alert: Alert(alertLabels)(),
        };
        const missing = Object.entries(merged)
            .filter(([, value]) => !value)
            .map(([key]) => key);
        if (missing.length) {
            logToMain("BlockNote missing blockSpecs:", missing);
        }
        return Object.fromEntries(
            Object.entries(merged).filter(([, value]) => value)
        );
    }, [alertLabels, logToMain]);

    const styleSpecs = useMemo(() => {
        const fontSizeStyleSpec = createStyleSpec(
            {
                type: "fontSize",
                propSchema: "string",
            },
            {
                render: (value) => {
                    const dom = document.createElement("span");
                    dom.style.fontSize = value || "";
                    dom.setAttribute("data-editable", "true");
                    return { dom, contentDOM: dom };
                },
            }
        );
        const fontFamilyStyleSpec = createStyleSpec(
            {
                type: "fontFamily",
                propSchema: "string",
            },
            {
                render: (value) => {
                    const dom = document.createElement("span");
                    dom.style.fontFamily = value || "";
                    dom.setAttribute("data-editable", "true");
                    return { dom, contentDOM: dom };
                },
            }
        );
        const merged = {
            ...defaultStyleSpecs,
            fontSize: fontSizeStyleSpec,
            fontFamily: fontFamilyStyleSpec,
        };
        const missing = Object.entries(merged)
            .filter(([, value]) => !value)
            .map(([key]) => key);
        if (missing.length) {
            logToMain("BlockNote missing styleSpecs:", missing);
        }
        return Object.fromEntries(
            Object.entries(merged).filter(([, value]) => value)
        );
    }, [logToMain]);

    const schema = useMemo(
        () =>
            BlockNoteSchema.create({
                blockSpecs,
                styleSpecs,
            }),
        [blockSpecs, styleSpecs]
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
        <div className="relative flex flex-col h-full">
            <div 
                ref={setToolbarContainer} 
                className="sticky top-0 z-30 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 py-2 px-4 transition-all bn-container myth-toolbar-container"
                data-theming-css-variables-demo
                data-color-scheme={darkMode ? 'dark' : 'light'}
            />
            <BlockNoteView
                editor={editor}
                slashMenu={false}
                formattingToolbar={false}
                data-theming-css-variables-demo
                className={isSlashSearching ? "bn-slash-searching flex-1 overflow-y-auto" : "flex-1 overflow-y-auto"}
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
                <ToolbarPortal container={toolbarContainer}>
                    <FormattingToolbar>
                        <BlockTypeSelect key={"blockTypeSelect"} />

                        <FontSizeSelect editor={editor} key={"fontSizeSelect"} />
                        <FontFamilySelect editor={editor} key={"fontFamilySelect"} />

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
                </ToolbarPortal>
            </BlockNoteView>
        </div>
    );
}

export default MythEditor
