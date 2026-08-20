import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function QueryEditor({ value, onChange, onRun }: Props) {
  return (
    <div
      className="query-editor"
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          onRun();
        }
      }}
    >
      <CodeMirror
        value={value}
        height="180px"
        extensions={[sql({ dialect: PostgreSQL })]}
        onChange={onChange}
        placeholder="SELECT * FROM your_table LIMIT 100"
        basicSetup={{ foldGutter: false }}
      />
    </div>
  );
}
