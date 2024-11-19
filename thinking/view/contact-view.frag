<div>
  <a-hstack>
    <a-vstack scale="5">
      <a-display state="$Display" slots="$Slots"></a-display>
      <a-tab-control state="$tab" scale="7">
        <a-tab-panel name="Chat Menu" background="#ffffbb">
          <a-grid
            name="chatMenu"
            rows="6"
            columns="6"
            tags="MENU CHAT"
            background="palegreen"
          ></a-grid>
        </a-tab-panel>
        <a-tab-panel name="Task Menu" background="#ffffbb">
          <a-grid
            name="taskMenu"
            rows="6"
            columns="6"
            tags="MENU TASK"
            background="pink"
          ></a-grid>
        </a-tab-panel>
        <a-tab-panel name="Story Menu" background="#ffffbb">
          <a-grid
            name="storyMenu"
            rows="6"
            columns="6"
            tags="MENU STORY"
            background="#f8d8b1"
          ></a-grid>
        </a-tab-panel>
        <a-tab-panel
          name="Chat $ChatTopic"
          label="Chat $ChatTopic"
          background="#ddffdd"
        >
          <a-hstack>
            <a-vstack scale="1">
              <a-choose-one
                kind="radio"
                state="$ChatPerson"
                tags="CHAT $ChatTopic"
                scale="1"
              >
                <a-choice value="Person.Me">Me</a-choice>
                <a-choice value="Person.You">You</a-choice>
              </a-choose-one>
              <a-gap scale="0.2"></a-gap>
              <a-choose-one
                kind="radio"
                state="$ChatTime"
                tags="CHAT $ChatTopic"
                scale="2"
              >
                <a-choice value="Time.Present">Present</a-choice>
                <a-choice value="Time.Past">Past</a-choice>
                <a-choice value="Time.Future">Future</a-choice>
              </a-choose-one>
              <a-gap scale="0.2"></a-gap>
              <a-choose-one
                state="$ChatAspect"
                tags="CHAT $ChatTopic"
                scale="4"
              >
                <a-choice value="Aspect.Who">Who</a-choice>
                <a-choice value="Aspect.What">What</a-choice>
                <a-choice value="Aspect.When">When</a-choice>
                <a-choice value="Aspect.Where">Where</a-choice>
                <a-choice value="Aspect.Why">Why</a-choice>
                <a-choice value="Aspect.How">How</a-choice>
              </a-choose-one>
            </a-vstack>
            <a-grid
              name="TalkGrid"
              rows="6"
              columns="4"
              tags="CHAT $ChatTopic $ChatPerson $ChatTime $ChatAspect"
              scale="4"
              background="white"
            >
            </a-grid>
          </a-hstack>
        </a-tab-panel>
        <a-tab-panel
          name="Task $TaskTopic"
          label="Task $TaskTopic"
          background="#ffdddd"
        >
          <a-hstack>
            <a-vstack scale="1">
              <a-choose-one state="$TaskRole" tags="TASK $TaskTopic" scale="1">
                <a-choice value="Role.Seek">Seek</a-choice>
                <a-choice value="Role.Assist">Assist</a-choice>
              </a-choose-one>
              <a-gap scale="0.2"></a-gap>
              <a-choose-one state="$TaskTime" tags="TASK $TaskTopic" scale="2">
                <a-choice value="Time.Present">Present</a-choice>
                <a-choice value="Time.Past">Past</a-choice>
                <a-choice value="Time.Future">Future</a-choice>
              </a-choose-one>
              <a-gap scale="0.2"></a-gap>
              <a-choose-one
                state="$TaskAspect"
                tags="TASK $TaskTopic"
                scale="3"
              >
                <a-choice value="Aspect.Who">Who</a-choice>
                <a-choice value="Aspect.What">What</a-choice>
                <a-choice value="Aspect.When">When</a-choice>
                <a-choice value="Aspect.Where">Where</a-choice>
                <a-choice value="Aspect.Why">Why</a-choice>
                <a-choice value="Aspect.How">How</a-choice>
              </a-choose-one>
            </a-vstack>
            <a-grid
              name="TalkGrid"
              rows="6"
              columns="4"
              tags="TASK $TaskTopic $TaskRole $TaskTime $TaskAspect"
              scale="4"
              background="white"
            ></a-grid>
          </a-hstack>
        </a-tab-panel>
        <a-tab-panel
          name="Story $StoryTopic"
          label="Story $StoryTopic"
          background="peachpuff"
        >
          <a-grid
            name="TalkGrid"
            rows="6"
            columns="6"
            tags="STORY $StoryTopic"
            background="white"
          ></a-grid>
        </a-tab-panel>
        <a-tab-panel name="My Page" background="peachpuff">
          <a-grid
            name="TalkGrid"
            rows="6"
            columns="5"
            tags="GREET $tab"
            background="white"
          ></a-grid>
        </a-tab-panel>
        <a-tab-panel name="Choose Quickfire" background="lavender">
          <a-grid
            name="TalkGrid"
            rows="6"
            columns="6"
            tags="Quick.Popup $Quick"
            background="#bdf"
          ></a-grid>
        </a-tab-panel>
        <a-tab-panel name="Keyboard" background="lemonchiffon">
          <p>Keyboard</p>
        </a-tab-panel>
        <a-tab-panel name="Popup" label="UNLABELED">
          <p>Popup</p>
        </a-tab-panel>
      </a-tab-control>
    </a-vstack>
    <a-vstack scale="1" background="lavender">
      <a-grid
        name="QuickGrid"
        rows="8"
        columns="3"
        tags="QUICK Quick.Random $Tone"
        scale="8"
        background="#bdf"
      ></a-grid>
      <a-choose-one state="$Tone" scale="1" initial="Tone.Normal">
        <a-choice value="Tone.Casual">Casual</a-choice>
        <a-choice value="Tone.Normal">Normal</a-choice>
        <a-choice value="Tone.Formal">Formal</a-choice>
      </a-choose-one>
    </a-vstack>
  </a-hstack>
  <a-modal-dialog state="$SlotsPopup">
    <a-hstack>
      <a-grid
        rows="5"
        columns="5"
        tags="LIST $Display.slotName"
        name="SlotGrid"
        scale="5"
      ></a-grid>
      <a-vstack scale="1">
        <a-button name="nextSlot">Next Slot</a-button>
        <a-button name="duplicateSlot">Duplicate Slot</a-button>
        <a-button name="okSlot">OK</a-button>
        <a-button name="cancelSlot">Cancel</a-button>
      </a-vstack>
    </a-hstack>
  </a-modal-dialog>
</div>
