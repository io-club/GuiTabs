import { TheftDataEntry } from "../../types";
import { apiUrlAtom, currentTabAtom, currentTabNamesAtom } from "../../state";
import { useAtom, useAtomValue } from "solid-jotai";
import { createEffect } from "solid-js";

export default function ContentViewer() {
  const [currentTab, setCurrentTab] = useAtom(currentTabAtom);
  const currentTabName = useAtomValue(currentTabNamesAtom);
  const [apiURL] = useAtom(apiUrlAtom);

  createEffect(async () => {
    if (!currentTabName() || !apiURL()) return;
    const response = (
      await fetch(apiURL() + "/sheet/" + currentTabName())
    ).json();
    const data = (await response) as TheftDataEntry;
    console.log(await response);
    setCurrentTab(data);
  }, [currentTabName(), apiURL()]);

  const mapTab = (content: TheftDataEntry) => {
    return content.content.map((e) => (
      <img
        src={`${apiURL()}/${content.name}/${e}`}
        style={{
          width: "auto",
          height: "auto",
          "max-width": "100%",
          "max-height": "100%",
          filter: content.meta?.invert ? "invert(1)" : "none",
        }}
      />
    ));
  };

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
      }}
    >
      {currentTab() ? (
        mapTab(currentTab() as TheftDataEntry)
      ) : (
        <img
          src="index.png"
          style={{
            width: "300px",
            height: "300px",
          }}
        />
      )}
    </div>
  );
}
