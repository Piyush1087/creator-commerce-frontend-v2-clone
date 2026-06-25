import { Button } from "../../../design-system/aurora";

import type { GroupedCoPilotThreads } from "../utils/thread-grouping";

import { CoPilotThreadList } from "./CoPilotThreadList";



type Props = {

  groupedThreads: GroupedCoPilotThreads[];

  groupedAllThreads: GroupedCoPilotThreads[];

  activeThreadId: string;

  isCreatingThread?: boolean;

  deletingThreadId?: string | null;

  showAllThreads: boolean;

  onSelect: (threadId: string) => void;

  onDelete: (threadId: string) => void;

  onCreateThread: () => void;

  onViewAll: () => void;

  onCloseViewAll: () => void;

};



export function CoPilotThreadRail({

  groupedThreads,

  groupedAllThreads,

  activeThreadId,

  isCreatingThread,

  deletingThreadId,

  showAllThreads,

  onSelect,

  onDelete,

  onCreateThread,

  onViewAll,

  onCloseViewAll,

}: Props) {

  return (

    <aside className="co-pilot-thread-rail">

      <div className="co-pilot-thread-rail__head">

        <span className="co-pilot-thread-rail__section-label">Recent thread logs</span>

        <Button

          type="button"

          size="sm"

          variant="outline"

          className="co-pilot-thread-rail__action"

          disabled={isCreatingThread}

          onClick={onCreateThread}

        >

          {isCreatingThread ? "Creating…" : "New conversation"}

        </Button>

      </div>



      <div className="co-pilot-thread-rail__scroll">

        {showAllThreads ? (

          <>

            <div className="co-pilot-thread-rail__view-all-head">

              <strong>All historical logs</strong>

              <Button type="button" size="sm" variant="outline" onClick={onCloseViewAll}>

                Close

              </Button>

            </div>

            <CoPilotThreadList

              groups={groupedAllThreads}

              activeThreadId={activeThreadId}

              deletingThreadId={deletingThreadId}

              onSelect={onSelect}

              onDelete={onDelete}

            />

          </>

        ) : (

          <CoPilotThreadList

            groups={groupedThreads}

            activeThreadId={activeThreadId}

            deletingThreadId={deletingThreadId}

            onSelect={onSelect}

            onDelete={onDelete}

          />

        )}

      </div>



      {!showAllThreads && (

        <div className="co-pilot-thread-rail__footer">

          <Button

            variant="outline"

            size="sm"

            type="button"

            className="co-pilot-thread-rail__action"

            onClick={onViewAll}

          >

            View all historical logs

          </Button>

        </div>

      )}

    </aside>

  );

}

