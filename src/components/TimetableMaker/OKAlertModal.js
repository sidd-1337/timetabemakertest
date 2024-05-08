import React, { Component } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import {t} from "i18next";


class OKAlertModal extends Component {
    render() {
        const { isOpen, onClose, message, title, onCancel } = this.props;

        return (
            <Dialog.Root open={isOpen} onOpenChange={onClose}>
                <Dialog.Portal>
                    <Dialog.Overlay className="overlay">
                        <Dialog.Content className="content">
                            <Dialog.Close asChild>
                                <button className="IconButton" onClick={onCancel}>
                                    <Cross2Icon />
                                </button>
                            </Dialog.Close>
                            <Dialog.Title>{title}</Dialog.Title>
                            <Dialog.Description>{message}</Dialog.Description>
                            <div style={{display: 'flex', marginTop: 25, justifyContent: 'flex-end'}}>
                                 <Dialog.Close asChild>
                                    <button className="btn-modal" onClick={onCancel}>{'OK'}</button>
                                </Dialog.Close>
                            </div>
                        </Dialog.Content>
                    </Dialog.Overlay>
                </Dialog.Portal>
            </Dialog.Root>
        );
    }
}

export default OKAlertModal;

